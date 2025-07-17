# Release Flow

This documents the release flow for the maintainers. If you're not a maintainer,
you don't need to read this.

To cut a release, follow these steps:

1. Create a release branch and update the `deno.json` version number

2. Create and land a PR

3. Pull the changes and tag the main branch:

   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

4. Publish the tag from github UI

5. Wait for the workspace publish action to publish the new release to JSR.
