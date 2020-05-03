export const NO_SLACK_ACCESS_TOKEN = `
No SLACK_ACCESS_TOKEN environment variable defined.

  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      with:
        slack_access_token: \${{ secrets.SLACK_ACCESS_TOKEN }}
`;

export const NO_GITHUB_TOKEN = `
No GITHUB_TOKEN environment variable defined.
  1) Ensure GITHUB_TOKEN environment variable is removed from all job steps
      or, explicitly use the default value as such:
  1) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

export const NO_JOB_STATUS = `
No JOB_STATUS environment variable defined.
  1) Ensure JOB_STATUS environment variable is removed from all job steps
      or, explicitly use the default value as such:
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
        JOB_STATUS: \${{ job.status }}
`;

export const TIMING_EXECUTION_LABEL = 'Execution runtime';

export const ARTIFACT_NAME = 'techpivot-streaming-slack-notifier.zip';

export const COLOR_SUCCESS = '#28a745';
export const COLOR_ERROR = '#ea3131';
export const COLOR_IN_PROGRESS = '#d2942c';
export const COLOR_QUEUED = '#d2d2d2';
