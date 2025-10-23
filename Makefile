clean:
	rm -rf build
	mkdir -p build
	touch build/.higit

build-plugin:
	@echo "Building redhat-ai-project-space"
	./build.sh backstage-plugin-redhat-ai-project-space redhat-ai-project-space

build-all: clean build-plugin
