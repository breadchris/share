package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/s3blob"
)

func CreateBucketAndUploadDir(bucketName, dir string) error {
	err := createS3Bucket(bucketName)
	if err != nil {
		return err
	}
	return uploadDirectoryToS3(bucketName, dir)
}

func createS3Bucket(bucketName string) error {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"),
	})
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	svc := s3.New(sess)

	_, err = svc.CreateBucket(&s3.CreateBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket %s: %w", bucketName, err)
	}

	err = svc.WaitUntilBucketExists(&s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		return fmt.Errorf("error occurred while waiting for bucket to be created: %w", err)
	}

	fmt.Printf("Successfully created bucket %s\n", bucketName)
	return nil
}

func uploadDirectoryToS3(bucketName, dir string) error {
	ctx := context.Background()
	bucketURL := fmt.Sprintf("s3://%s", bucketName)

	bucket, err := blob.OpenBucket(ctx, bucketURL)
	if err != nil {
		return fmt.Errorf("failed to open bucket: %w", err)
	}
	defer bucket.Close()

	files, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		localFilePath := fmt.Sprintf("%s/%s", dirPath, file.Name())
		fileContent, err := os.Open(localFilePath)
		if err != nil {
			return fmt.Errorf("failed to open file %s: %w", localFilePath, err)
		}
		defer fileContent.Close()

		objectPath := file.Name()
		writer, err := bucket.NewWriter(ctx, objectPath, nil)
		if err != nil {
			return err
		}

		if _, err = fileContent.WriteTo(writer); err != nil {
			return err
		}

		if err = writer.Close(); err != nil {
			return err
		}
	}
}
