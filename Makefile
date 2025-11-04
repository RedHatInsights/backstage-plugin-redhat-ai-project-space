clean:
	rm -rf build
	mkdir -p build
	touch build/.higit

build-plugin:
	@echo "Building redhat-ai-project-space"
	./build.sh backstage-plugin-redhat-ai-project-space redhat-ai-project-space

build-backend-plugin:
	@echo "Building redhat-ai-project-space-backend"
	./build.sh backstage-plugin-redhat-ai-project-space-backend redhat-ai-project-space-backend

build-all: clean build-plugin build-backend-plugin
