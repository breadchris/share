package main

import (
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/container"
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/projects"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	appsv1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/apps/v1"
	corev1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/core/v1"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/helm/v3"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Get the current project from config
		project := ctx.Stack() // This should be set via pulumi config
		if project == "" {
			project = "planar-sun-402202"
		}

		// Enable required GCP APIs
		containerAPI, err := projects.NewService(ctx, "container-api", &projects.ServiceArgs{
			Project: pulumi.String(project),
			Service: pulumi.String("container.googleapis.com"),
		})
		if err != nil {
			return err
		}

		computeAPI, err := projects.NewService(ctx, "compute-api", &projects.ServiceArgs{
			Project: pulumi.String(project),
			Service: pulumi.String("compute.googleapis.com"),
		}, pulumi.DependsOn([]pulumi.Resource{containerAPI}))
		if err != nil {
			return err
		}

		containerRegistryAPI, err := projects.NewService(ctx, "container-registry-api", &projects.ServiceArgs{
			Project: pulumi.String(project),
			Service: pulumi.String("containerregistry.googleapis.com"),
		}, pulumi.DependsOn([]pulumi.Resource{computeAPI}))
		if err != nil {
			return err
		}

		// Create a GKE cluster
		cluster, err := container.NewCluster(ctx, "gke-cluster", &container.ClusterArgs{
			Name:                  pulumi.String("flow-worklet-cluster"),
			Location:              pulumi.String("us-central1-a"),
			InitialNodeCount:      pulumi.Int(1),
			MinMasterVersion:      pulumi.String("latest"),
			RemoveDefaultNodePool: pulumi.Bool(true),
			NodeConfig: &container.ClusterNodeConfigArgs{
				MachineType: pulumi.String("n1-standard-2"),
				OauthScopes: pulumi.StringArray{
					pulumi.String("https://www.googleapis.com/auth/compute"),
					pulumi.String("https://www.googleapis.com/auth/devstorage.read_only"),
					pulumi.String("https://www.googleapis.com/auth/logging.write"),
					pulumi.String("https://www.googleapis.com/auth/monitoring"),
				},
			},
		}, pulumi.DependsOn([]pulumi.Resource{containerRegistryAPI}))
		if err != nil {
			return err
		}

		// Create a separately managed node pool
		nodePool, err := container.NewNodePool(ctx, "primary-node-pool", &container.NodePoolArgs{
			Name:     pulumi.String("primary-pool"),
			Cluster:  cluster.Name,
			Location: cluster.Location,
			NodeConfig: &container.NodePoolNodeConfigArgs{
				MachineType: pulumi.String("n1-standard-2"),
				DiskSizeGb:  pulumi.Int(100),
				OauthScopes: pulumi.StringArray{
					pulumi.String("https://www.googleapis.com/auth/compute"),
					pulumi.String("https://www.googleapis.com/auth/devstorage.read_only"),
					pulumi.String("https://www.googleapis.com/auth/logging.write"),
					pulumi.String("https://www.googleapis.com/auth/monitoring"),
				},
			},
			Autoscaling: &container.NodePoolAutoscalingArgs{
				MinNodeCount: pulumi.Int(1),
				MaxNodeCount: pulumi.Int(5),
			},
			Management: &container.NodePoolManagementArgs{
				AutoRepair:  pulumi.Bool(true),
				AutoUpgrade: pulumi.Bool(true),
			},
		}, pulumi.DependsOn([]pulumi.Resource{cluster}))
		if err != nil {
			return err
		}

		// Create Kubernetes provider using the cluster credentials
		kubeconfig := pulumi.Sprintf(`apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: %s
    server: https://%s
  name: flow-worklet-cluster
contexts:
- context:
    cluster: flow-worklet-cluster
    user: flow-worklet-cluster
  name: flow-worklet-cluster
current-context: flow-worklet-cluster
kind: Config
preferences: {}
users:
- name: flow-worklet-cluster
  user:
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp`,
			cluster.MasterAuth.ClusterCaCertificate().Elem(),
			cluster.Endpoint)

		k8sProvider, err := kubernetes.NewProvider(ctx, "k8s-provider", &kubernetes.ProviderArgs{
			Kubeconfig: kubeconfig,
		}, pulumi.DependsOn([]pulumi.Resource{nodePool}))
		if err != nil {
			return err
		}

		// Install cert-manager
		certManagerRelease, err := helm.NewRelease(ctx, "cert-manager", &helm.ReleaseArgs{
			Chart:           pulumi.String("cert-manager"),
			Version:         pulumi.String("v1.13.0"),
			Namespace:       pulumi.String("cert-manager"),
			CreateNamespace: pulumi.Bool(true),
			RepositoryOpts: &helm.RepositoryOptsArgs{
				Repo: pulumi.String("https://charts.jetstack.io"),
			},
			Values: pulumi.Map{
				"installCRDs": pulumi.Bool(true),
			},
		}, pulumi.Provider(k8sProvider))
		if err != nil {
			return err
		}

		// Create Let's Encrypt ClusterIssuer for production
		_, err = kubernetes.NewManifest(ctx, "letsencrypt-prod-issuer", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("cert-manager.io/v1"),
				"kind":       pulumi.String("ClusterIssuer"),
				"metadata": pulumi.Map{
					"name": pulumi.String("letsencrypt-prod"),
				},
				"spec": pulumi.Map{
					"acme": pulumi.Map{
						"server": pulumi.String("https://acme-v02.api.letsencrypt.org/directory"),
						"email":  pulumi.String("chris@breadchris.com"),
						"privateKeySecretRef": pulumi.Map{
							"name": pulumi.String("letsencrypt-prod"),
						},
						"solvers": pulumi.Array{
							pulumi.Map{
								"http01": pulumi.Map{
									"ingress": pulumi.Map{
										"class": pulumi.String("traefik"),
									},
								},
							},
						},
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{certManagerRelease}))
		if err != nil {
			return err
		}

		// Install Traefik with ACME-compatible configuration (no global redirect)
		traefikRelease, err := helm.NewRelease(ctx, "traefik", &helm.ReleaseArgs{
			Chart:           pulumi.String("traefik"),
			Version:         pulumi.String("28.3.0"),
			Namespace:       pulumi.String("traefik-system"),
			CreateNamespace: pulumi.Bool(true),
			RepositoryOpts: &helm.RepositoryOptsArgs{
				Repo: pulumi.String("https://helm.traefik.io/traefik"),
			},
			Values: pulumi.Map{
				"deployment": pulumi.Map{
					"replicas": pulumi.Int(1), // Single replica to allow ACME
				},
				"service": pulumi.Map{
					"type": pulumi.String("LoadBalancer"),
				},
				"additionalArguments": pulumi.StringArray{
					// Let's Encrypt configuration
					pulumi.String("--certificatesresolvers.letsencrypt.acme.email=chris@breadchris.com"),
					pulumi.String("--certificatesresolvers.letsencrypt.acme.storage=/data/acme.json"),
					pulumi.String("--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"),
					// Enable both providers for maximum compatibility
					pulumi.String("--providers.kubernetescrd"),
					pulumi.String("--providers.kubernetesingress"),
					pulumi.String("--providers.kubernetesingress.allowEmptyServices=true"),
				},
				"persistence": pulumi.Map{
					"enabled": pulumi.Bool(true),
					"size":    pulumi.String("1Gi"),
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{nodePool}))
		if err != nil {
			return err
		}

		// Create HTTPS redirect middleware (selective, not global)
		_, err = kubernetes.NewManifest(ctx, "https-redirect-middleware", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("traefik.io/v1alpha1"),
				"kind":       pulumi.String("Middleware"),
				"metadata": pulumi.Map{
					"name":      pulumi.String("https-redirect"),
					"namespace": pulumi.String("default"),
				},
				"spec": pulumi.Map{
					"redirectScheme": pulumi.Map{
						"scheme":    pulumi.String("https"),
						"permanent": pulumi.Bool(true),
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{traefikRelease}))
		if err != nil {
			return err
		}

		// Create security headers middleware
		_, err = kubernetes.NewManifest(ctx, "security-headers-middleware", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("traefik.io/v1alpha1"),
				"kind":       pulumi.String("Middleware"),
				"metadata": pulumi.Map{
					"name":      pulumi.String("security-headers"),
					"namespace": pulumi.String("default"),
				},
				"spec": pulumi.Map{
					"headers": pulumi.Map{
						"customRequestHeaders": pulumi.Map{
							"X-Forwarded-Proto": "https",
						},
						"customResponseHeaders": pulumi.Map{
							"X-Frame-Options":         "DENY",
							"X-Content-Type-Options":  "nosniff",
							"X-XSS-Protection":        "1; mode=block",
							"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
						},
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{traefikRelease}))
		if err != nil {
			return err
		}

		// Deploy the example application
		appDeployment, err := appsv1.NewDeployment(ctx, "flow-worklet-app", &appsv1.DeploymentArgs{
			Metadata: &metav1.ObjectMetaArgs{
				Name: pulumi.String("flow-worklet-app"),
				Labels: pulumi.StringMap{
					"app": pulumi.String("flow-worklet"),
				},
			},
			Spec: &appsv1.DeploymentSpecArgs{
				Replicas: pulumi.Int(3),
				Selector: &metav1.LabelSelectorArgs{
					MatchLabels: pulumi.StringMap{
						"app": pulumi.String("flow-worklet"),
					},
				},
				Template: &corev1.PodTemplateSpecArgs{
					Metadata: &metav1.ObjectMetaArgs{
						Labels: pulumi.StringMap{
							"app": pulumi.String("flow-worklet"),
						},
					},
					Spec: &corev1.PodSpecArgs{
						Containers: corev1.ContainerArray{
							&corev1.ContainerArgs{
								Name:  pulumi.String("app"),
								Image: pulumi.Sprintf("gcr.io/%s/flow-worklet-example:latest", project),
								Ports: corev1.ContainerPortArray{
									&corev1.ContainerPortArgs{
										ContainerPort: pulumi.Int(8080),
									},
								},
								Env: corev1.EnvVarArray{
									&corev1.EnvVarArgs{
										Name:  pulumi.String("PORT"),
										Value: pulumi.String("8080"),
									},
								},
								Resources: &corev1.ResourceRequirementsArgs{
									Requests: pulumi.StringMap{
										"memory": pulumi.String("64Mi"),
										"cpu":    pulumi.String("250m"),
									},
									Limits: pulumi.StringMap{
										"memory": pulumi.String("128Mi"),
										"cpu":    pulumi.String("500m"),
									},
								},
								LivenessProbe: &corev1.ProbeArgs{
									HttpGet: &corev1.HTTPGetActionArgs{
										Path: pulumi.String("/health"),
										Port: pulumi.Int(8080),
									},
									InitialDelaySeconds: pulumi.Int(30),
									PeriodSeconds:       pulumi.Int(10),
								},
								ReadinessProbe: &corev1.ProbeArgs{
									HttpGet: &corev1.HTTPGetActionArgs{
										Path: pulumi.String("/health"),
										Port: pulumi.Int(8080),
									},
									InitialDelaySeconds: pulumi.Int(5),
									PeriodSeconds:       pulumi.Int(5),
								},
							},
						},
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{traefikRelease}))
		if err != nil {
			return err
		}

		// Create service for the application
		appService, err := corev1.NewService(ctx, "flow-worklet-service", &corev1.ServiceArgs{
			Metadata: &metav1.ObjectMetaArgs{
				Name: pulumi.String("flow-worklet-service"),
			},
			Spec: &corev1.ServiceSpecArgs{
				Selector: pulumi.StringMap{
					"app": pulumi.String("flow-worklet"),
				},
				Ports: corev1.ServicePortArray{
					&corev1.ServicePortArgs{
						Port:       pulumi.Int(80),
						TargetPort: pulumi.Int(8080),
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{appDeployment}))
		if err != nil {
			return err
		}

		// Create TLS certificate
		_, err = kubernetes.NewManifest(ctx, "flow-worklet-certificate", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("cert-manager.io/v1"),
				"kind":       pulumi.String("Certificate"),
				"metadata": pulumi.Map{
					"name":      pulumi.String("flow-worklet-tls"),
					"namespace": pulumi.String("default"),
				},
				"spec": pulumi.Map{
					"secretName": pulumi.String("flow-worklet-tls"),
					"issuerRef": pulumi.Map{
						"name": pulumi.String("letsencrypt-prod"),
						"kind": pulumi.String("ClusterIssuer"),
					},
					"dnsNames": pulumi.StringArray{
						pulumi.String("flow-worklet.baked.mom"),
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{certManagerRelease}))
		if err != nil {
			return err
		}

		// Create IngressRoute for HTTPS traffic
		_, err = kubernetes.NewManifest(ctx, "flow-worklet-ingressroute-https", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("traefik.io/v1alpha1"),
				"kind":       pulumi.String("IngressRoute"),
				"metadata": pulumi.Map{
					"name":      pulumi.String("flow-worklet-ingressroute"),
					"namespace": pulumi.String("default"),
				},
				"spec": pulumi.Map{
					"entryPoints": pulumi.StringArray{
						pulumi.String("websecure"),
					},
					"routes": pulumi.Array{
						pulumi.Map{
							"match": pulumi.String("Host(`flow-worklet.baked.mom`)"),
							"kind":  pulumi.String("Rule"),
							"services": pulumi.Array{
								pulumi.Map{
									"name": pulumi.String("flow-worklet-service"),
									"port": pulumi.Int(80),
								},
							},
							"middlewares": pulumi.StringArray{
								pulumi.String("security-headers@kubernetescrd"),
							},
						},
					},
					"tls": pulumi.Map{
						"secretName": pulumi.String("flow-worklet-tls"),
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{appService, traefikRelease}))
		if err != nil {
			return err
		}

		// Create IngressRoute for HTTP traffic (with redirect)
		_, err = kubernetes.NewManifest(ctx, "flow-worklet-ingressroute-http", &kubernetes.ManifestArgs{
			Object: pulumi.Map{
				"apiVersion": pulumi.String("traefik.io/v1alpha1"),
				"kind":       pulumi.String("IngressRoute"),
				"metadata": pulumi.Map{
					"name":      pulumi.String("flow-worklet-ingressroute-http"),
					"namespace": pulumi.String("default"),
				},
				"spec": pulumi.Map{
					"entryPoints": pulumi.StringArray{
						pulumi.String("web"),
					},
					"routes": pulumi.Array{
						pulumi.Map{
							"match": pulumi.String("Host(`flow-worklet.baked.mom`)"),
							"kind":  pulumi.String("Rule"),
							"services": pulumi.Array{
								pulumi.Map{
									"name": pulumi.String("flow-worklet-service"),
									"port": pulumi.Int(80),
								},
							},
							"middlewares": pulumi.StringArray{
								pulumi.String("https-redirect@kubernetescrd"),
							},
						},
					},
				},
			},
		}, pulumi.Provider(k8sProvider), pulumi.DependsOn([]pulumi.Resource{appService, traefikRelease}))
		if err != nil {
			return err
		}

		// Export important values
		ctx.Export("clusterName", cluster.Name)
		ctx.Export("clusterEndpoint", cluster.Endpoint)
		ctx.Export("nodePoolName", nodePool.Name)
		ctx.Export("kubeconfig", kubeconfig)
		ctx.Export("traefikRelease", traefikRelease.Name)

		// Export LoadBalancer IP (this will be available after deployment)
		traefikService := traefikRelease.Status.ApplyT(func(status interface{}) (string, error) {
			return "traefik-system/traefik", nil
		}).(pulumi.StringOutput)

		ctx.Export("loadBalancerService", traefikService)

		// Export deployment instructions
		deploymentInstructions := pulumi.Sprintf(`
Deployment Complete! 

Next Steps:
1. Get the LoadBalancer IP:
   kubectl get svc -n traefik-system traefik

2. Configure DNS:
   Set A record: flow-worklet.baked.mom -> [LoadBalancer IP]

3. Verify application:
   curl https://flow-worklet.baked.mom

4. Monitor certificate:
   kubectl get certificate flow-worklet-tls

Project ID: %s
Cluster: %s
Location: us-central1-a
`, project, cluster.Name)

		ctx.Export("instructions", deploymentInstructions)

		return nil
	})
}