export const NO_SLACK_ACCESS_TOKEN = `
No SLACK_ACCESS_TOKEN environment variable defined.

  1) Navigate to Repository > Settings > Secrets and add SLACK_ACCESS_TOKEN secret
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      with:
        slack_access_token: \${{ secrets.SLACK_ACCESS_TOKEN }}
`;

export const NO_GITHUB_TOKEN = `
No GITHUB_TOKEN environment variable defined.
  1) Ensure GITHUB_TOKEN environment variable is removed from all job steps (included automatically)
      or, explicitly use the default value as such:
  1) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

export const NO_CURRENT_JOB_STATUS = `
No CURRENT_JOB_STATUS environment variable defined.
  1) Ensure CURRENT_JOB_STATUS environment variable is removed from all job steps (included automatically)
      or, explicitly use the default value as such:
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
      CURRENT_JOB_STATUS: \${{ job.status }}
`;

export const NO_CURRENT_JOB_NAME = `
No CURRENT_JOB_NAME environment variable defined.
  1) Ensure CURRENT_JOB_NAME environment variable is removed from all job steps (included automatically)
      or, explicitly use the default value as such:
  2) Update Github workflow file (e.g.  ./github/workflows/main.yml) to include:
      env:
      CURRENT_JOB_NAME: \${{ github.job }}
`;

export const TIMING_EXECUTION_LABEL = 'Execution runtime';

export const ARTIFACT_NAME = 'techpivot-streaming-slack-notifier.zip';
