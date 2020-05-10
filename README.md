<h1 align="center">Streaming Slack Notify</h1>

<h4 align="center">
  The definitive <a href="https://github.com/features/actions">Github Action</a>
  for streaming workflow job status to Slack.
</h4>
<h6 align="center">
  Actively maintained by <a href="https://www.techpivot.net">TechPivot</a> and the community.
</h4>

<p align="center">
  <a href="https://github.com/techpivot/streaming-slack-notify/actions">
    <img src="https://github.com/techpivot/streaming-slack-notify/workflows/Main/badge.svg?branch=master" />
  </a>
  <a href="https://codeclimate.com/repos/5eb1cb1c668cc4318e007908/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/0ffe5bd35f9e43f827b9/maintainability" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/releases">
    <img src="https://img.shields.io/github/v/release/techpivot/streaming-slack-notify" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/issues">
    <img src="https://img.shields.io/github/issues/techpivot/streaming-slack-notify.svg" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/techpivot/streaming-slack-notify" />
  </a>
  <a href="https://github.com/techpivot/streaming-slack-notify/stargazers">
    <img src="https://img.shields.io/github/stars/techpivot/streaming-slack-notify.svg?style=social&label=Stars&maxAge=2592000" />
  </a>
</p>

## Motivation

## Usage

## Sample Output

### Event: `push`

### Event: `pull_request`
Default output if you've not set any attachment will look like this.

![Image of screenshot](https://raw.githubusercontent.com/cemkiy/action-slacker/master/screnshot.png)

If you've set an attachment, you should see it in addition to default message.

## Configuration Options



## Contributing

Please see [Slack API documentation](https://api.slack.com/docs/messages/builder) in addition to source code in this repository.

## License

[MIT](LICENSE) © 2020 TechPivot

---

> **[TechPivot](https://www.techpivot.net)** &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> GitHub [@techpivot](https://github.com/techpivot) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> LinkedIn [techpivot](https://www.linkedin.com/company/techpivot/) &nbsp;&nbsp;&middot;&nbsp;&nbsp;
> Twitter [@techpivot](https://twitter.com/techpivot)

======

## Configuration

You must set `SLACK_WEBHOOK` environment value in settings page of your repository in order to use without any problem. Please [see here](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets#creating-encrypted-secrets) to learn how to do it if you don't know already.

## Usage

Create a workflow, set a step that uses this action and don't forget to specify `SLACK_WEBHOOK` environment value.

```yaml
name: Notification on push

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Slack notification
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
        uses: cemkiy/action-slacker@master
        with:
          # requirements fields for slack
          channel: '#channel-name'
          icon_url: 'slack user icon url'
          username: 'slack username'
          # attachment fields(not required)
          fallback: 'Required plain-text summary of the attachment.'
          color: '#36a64f'
          pretext: 'Optional text that appears above the attachment block'
          author_name: 'John Doe'
          author_link: 'http://jdoe.com/me/'
          author_icon: 'http://imageurl.com/icons/icon.jpg'
          title: 'Slack API Documentation'
          title_link: 'https://api.slack.com/'
          text: 'Optional text that appears within the attachment'
          image_url: 'http://my-website.com/path/to/image.jpg'
          thumb_url: 'http://example.com/path/to/thumb.png'
          footer: 'Slack API'
          footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png'
```

## Output

Default output if you've not set any attachment will look like this.

![Image of screenshot](https://raw.githubusercontent.com/cemkiy/action-slacker/master/screnshot.png)

If you've set an attachment, you should see it in addition to default message.

## Advanced Usage

If you want to show different messages based on succes or failure of previous steps in your workflow, use success and failure functions.

```yaml
- name: Slack notification Failure
  if: failure()
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
  uses: cemkiy/action-slacker@master
  with:
    channel: '#channel-name'
    icon_url: 'slack user icon url'
    username: 'slack username'
    image_url: 'http://my-website.com/path/to/failure.jpg'

- name: Slack notification Success
  if: success()
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
  uses: cemkiy/action-slacker@master
  with:
    channel: '#channel-name'
    icon_url: 'slack user icon url'
    username: 'slack username'
    image_url: 'http://my-website.com/path/to/success.jpg'
```
