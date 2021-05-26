# Contributing Guide

## Helping Out

[Pull requests](https://github.com/techpivot/streaming-slack-notify/pulls) are the best way to propose changes to the
codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
1. Add/update your code in the corresponding `./packages` directory as necessary.
1. Ensure documentation is up-to-date.
1. Make sure your code formats and lints. (`yarn format` and `yarn lint`)
1. Submit the pull request!

## Issues / Feature Requests

We use GitHub issues to track public bugs and feature requests. Report a bug by
[opening a new issue](https://github.com/techpivot/streaming-slack-notify/issues); it's that easy!

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Coding Style

We use [Prettier](https://prettier.io/) for consistent formatting of most files and Terraform built in `fmt` for
Terraform specific infrastructure files.

Formatting settings for prettier are located in `.prettierrc`.

To format all packages:

```shell
yarn format
```

## Developer Reference

- Project setup is a Monorepo using Yarn workspaces. There are several API endpoint packages which are NodeJS lambda
  functions as well as the core `server` poller package. Shared/re-used code is located in the `common` package.

- If you need to run any of the the NPM/Yarn commands on a system that may not have anything installed, we provide a
  docker-compose helper.

  ```bash
  docker-compose up

  # Then in another terminal:
  docker exec -it streaming-slack-notify bash
  ```

- [Slack Block Kit Builder](https://api.slack.com/tools/block-kit-builder)
  > Use the Slack debug payload from existing actions to seed a message builder and then iterate as necessary.

## License

By contributing, you agree that your contributions will be licensed under the [MIT license](LICENSE).

---

> **[TechPivot](https://www.techpivot.net)**&nbsp;&nbsp;&middot;&nbsp;&nbsp;GitHub
> [@techpivot](https://github.com/techpivot)&nbsp;&nbsp;&middot;&nbsp;&nbsp;LinkedIn
> [techpivot](https://www.linkedin.com/company/techpivot/)&nbsp;&nbsp;&middot;&nbsp;&nbsp;Twitter
> [@techpivot](https://twitter.com/techpivot)
