# Deployment Resources

Resources to manage builds and deployment for my personal test environments.

## Environments

A number of configuration files exist for various development setups:

| Environment | Description |
| ----------- | ----------- |
| dev | Local development of the OAuth Agent component |
| docker-local | Used to test local deployment, and also to provide a local token handler when running and SPA and API locally |
| kubernetes-local | An end-to-end deployment of SPA, API and token handler components that runs in a KIND cluster |
| kubernetes-aws | An end-to-end deployment of SPA, API and token handler components that runs in an AWS cluster |

## Shared

The shared resources include the Dockerfile and are used in multiple deployment scenarios.

## Docker Local

Scripts to test standalone Docker deployment of the token handler components:

```bash
cd deployment/docker-local
./build.sh
./deploy.sh
./teardown.sh
```

## Kubernetes Local

Scripts invoked using parent scripts from a **Cloud Native Local** project.\
This runs an end-to-end SPA and API setup in a local Kubernetes in Docker (KIND) cluster.

## Kubernetes AWS

Scripts invoked using parent scripts from a **Cloud Native AWS** project.\
This runs an end-to-end SPA and API setup in a cloud EKS cluster.
