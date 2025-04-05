# Release Flow

This is release flow for the maintainers. If you're not a maintainer, you don't need to read this.

To cut a release, follow these steps:

1. Create a release branch and run the version bump script:
   ```sh
   deno run -A jsr:@deno/bump-workspaces@0.1.22/cli
   ```
   Note: it will throw a "No target files found" error but this may be in
   prerelease only

1. Review the changes and create a PR

1. Land the PR

1. Tag the main branch with vMaj.Min.Patch (this step can be automated in the
   future):

   ```sh
   git tag vMaj.Min.Patch
   git push origin vMaj.Min.Patch
   ```

2. Publish the tag from github UI.

3. Wait for the workspace publish action to publish the new versions to JSR.
