package main

import (
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/container"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/helm/v3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Create a GKE cluster
		cluster, err := container.NewCluster(ctx, "gke-cluster", &container.ClusterArgs{
			Name:                  pulumi.String("flow-worklet-cluster"),
			Location:              pulumi.String("us-central1-a"),
			InitialNodeCount:      pulumi.Int(3),
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
		})
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
		})
		if err != nil {
			return err
		}

		// Export the cluster name and kubeconfig
		ctx.Export("clusterName", cluster.Name)
		ctx.Export("clusterEndpoint", cluster.Endpoint)
		ctx.Export("nodePoolName", nodePool.Name)
		
		// Deploy Traefik using Helm
		traefikRelease, err := helm.NewRelease(ctx, "traefik", &helm.ReleaseArgs{
			Chart:     pulumi.String("traefik"),
			Version:   pulumi.String("28.3.0"),
			Namespace: pulumi.String("traefik-system"),
			CreateNamespace: pulumi.Bool(true),
			RepositoryOpts: &helm.RepositoryOptsArgs{
				Repo: pulumi.String("https://helm.traefik.io/traefik"),
			},
			Values: pulumi.Map{
				"deployment": pulumi.Map{
					"replicas": pulumi.Int(2),
				},
				"service": pulumi.Map{
					"type": pulumi.String("LoadBalancer"),
				},
				"ports": pulumi.Map{
					"web": pulumi.Map{
						"port": pulumi.Int(80),
						"expose": pulumi.Bool(true),
						"redirectTo": pulumi.Map{
							"port": pulumi.String("websecure"),
						},
					},
					"websecure": pulumi.Map{
						"port": pulumi.Int(443),
						"expose": pulumi.Bool(true),
						"tls": pulumi.Map{
							"enabled": pulumi.Bool(true),
						},
					},
				},
				"certificatesResolvers": pulumi.Map{
					"letsencrypt": pulumi.Map{
						"acme": pulumi.Map{
							"email": pulumi.String("admin@example.com"), // Replace with your email
							"storage": pulumi.String("/data/acme.json"),
							"httpChallenge": pulumi.Map{
								"entryPoint": pulumi.String("web"),
							},
						},
					},
				},
				"persistence": pulumi.Map{
					"enabled": pulumi.Bool(true),
					"size": pulumi.String("1Gi"),
				},
				"additionalArguments": pulumi.StringArray{
					pulumi.String("--certificatesresolvers.letsencrypt.acme.caserver=https://acme-v02.api.letsencrypt.org/directory"),
					pulumi.String("--entrypoints.web.http.redirections.entrypoint.to=websecure"),
					pulumi.String("--entrypoints.web.http.redirections.entrypoint.scheme=https"),
				},
			},
		})
		if err != nil {
			return err
		}

		// Export kubeconfig
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
		
		ctx.Export("kubeconfig", kubeconfig)
		ctx.Export("traefikRelease", traefikRelease.Name)

		return nil
	})
}