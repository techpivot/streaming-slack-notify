export const NO_SLACK_ACCESS_TOKEN = `
No SLACK_ACCESS_TOKEN secret defined.

  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
        SLACK_ACCESS_TOKEN: \${{ secrets.SLACK_ACCESS_TOKEN }}
`;

export const TIMING_EXECUTION_LABEL = 'Execution runtime';

export const ARTIFACT_NAME = 'techpivot-streaming-slack-notifier.zip';

export const COLOR_SUCCESS = '#28a745';
export const COLOR_ERROR = '#ea3131';
export const COLOR_IN_PROGRESS = '#ffc25c';
