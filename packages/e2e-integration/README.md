# Application integration tests

This package contains focused scenarios that need a real LVCE application checkout. The Integration workflow overlays this repository's built task-worker package into a pinned, disposable LVCE checkout, installs the app dependencies, and runs the selected scenarios through the existing Playwright runner.

The default build task scenario stays skipped until the pinned application includes the task-worker and command-palette integration. Enable it after updating the application pin and confirm that the task executes in the selected workspace.
