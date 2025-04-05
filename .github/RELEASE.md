# Release Flow

This is release flow for the maintainers. If you're not a maintainer, you don't need to read this.

To cut a release, follow these steps:

1. Create a release branch and update the deno.json version field accordingly

2. Create and land the PR

3. Tag the main branch with the semver version:

   ```sh
   git tag vMaj.Min.Patch
   git push origin vMaj.Min.Patch
   ```

4. Publish the tag from github UI.

5. Wait for the workspace publish action to publish the new versions to JSR.
