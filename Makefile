.PHONY: clean build-ai-project-space-frontend build-ai-project-space-backend build-all
clean:
	rm -rf build
	mkdir -p build

build-ai-project-space-frontend:
	@echo "Building webrca-frontend"
	./build.sh backstage-plugin-redhat-ai-project-space redhat-ai-project-space

build-ai-project-space-backend:
	@echo "Building webrca-backend"
	./build.sh backstage-plugin-redhat-ai-project-space-backend redhat-ai-project-space-backend

build-all: clean build-ai-project-space-frontend build-ai-project-space-backend
