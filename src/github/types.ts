export type ActionsStatus = 'queued' | 'in_progress' | 'completed';

export type ActionsConclusion =
  | null
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required';

export type ActionsListJobsForWorkflowRunResponseJobsItemStepsItem = {
  status: ActionsStatus;
  conclusion: ActionsConclusion;
  name: string;
  number: number;
  // Currently we need to mock this for the last completed step. Currently ommitting the last two
  // started_at: string;
  // completed_at: string;
};

export type ActionsListJobsForWorkflowRunResponseJobsItem = {
  check_run_url: string;
  completed_at: string;
  conclusion: ActionsConclusion;
  head_sha: string;
  html_url: string;
  id: number;
  name: string;
  node_id: string;
  run_id: number;
  run_url: string;
  started_at: string;
  status: ActionsStatus;
  steps: ActionsListJobsForWorkflowRunResponseJobsItemStepsItem[];
  url: string;
};

export type ActionsGetWorkflowRunResponseHeadCommitAuthor = {
  email: string;
  name: string;
};

export type ActionsGetWorkflowRunResponseHeadCommitCommitter = {
  email: string;
  name: string;
};

export type ActionsGetWorkflowRunResponseHeadCommit = {
  author: ActionsGetWorkflowRunResponseHeadCommitAuthor;
  committer: ActionsGetWorkflowRunResponseHeadCommitCommitter;
  id: string;
  message: string;
  timestamp: string;
  tree_id: string;
};

export type ActionsGetWorkflowRunResponseHeadRepository = {
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  description: null;
  downloads_url: string;
  events_url: string;
  fork: boolean;
  forks_url: string;
  full_name: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  hooks_url: string;
  html_url: string;
  id: number;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  name: string;
  node_id: string;
  notifications_url: string;
  owner: ActionsGetWorkflowRunResponseHeadRepositoryOwner;
  private: boolean;
  pulls_url: string;
  releases_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  url: string;
};

export interface ActionsGetWorkflowRunResponseRepositoryOwner {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
}

export type ActionsGetWorkflowRunResponseHeadRepositoryOwner = ActionsGetWorkflowRunResponseRepositoryOwner

export type ActionsGetWorkflowRunResponseRepository = {
  archive_url: string;
  assignees_url: string;
  blobs_url: string;
  branches_url: string;
  collaborators_url: string;
  comments_url: string;
  commits_url: string;
  compare_url: string;
  contents_url: string;
  contributors_url: string;
  deployments_url: string;
  description: string;
  downloads_url: string;
  events_url: string;
  fork: boolean;
  forks_url: string;
  full_name: string;
  git_commits_url: string;
  git_refs_url: string;
  git_tags_url: string;
  git_url: string;
  html_url: string;
  id: number;
  issue_comment_url: string;
  issue_events_url: string;
  issues_url: string;
  keys_url: string;
  labels_url: string;
  languages_url: string;
  merges_url: string;
  milestones_url: string;
  name: string;
  node_id: string;
  notifications_url: string;
  owner: ActionsGetWorkflowRunResponseRepositoryOwner;
  private: boolean;
  pulls_url: string;
  releases_url: string;
  ssh_url: string;
  stargazers_url: string;
  statuses_url: string;
  subscribers_url: string;
  subscription_url: string;
  tags_url: string;
  teams_url: string;
  trees_url: string;
  url: string;
};

export type ActionsGetWorkflowRunResponse = {
  artifacts_url: string;
  cancel_url: string;
  check_suite_id: number;
  conclusion: ActionsConclusion;
  created_at: string;
  event: string;
  head_branch: string;
  head_commit: ActionsGetWorkflowRunResponseHeadCommit;
  head_repository: ActionsGetWorkflowRunResponseHeadRepository;
  head_sha: string;
  html_url: string;
  id: number;
  jobs_url: string;
  logs_url: string;
  node_id: string;
  // @todo fix this
  // eslint-disable-next-line
  pull_requests: Array<any>;
  repository: ActionsGetWorkflowRunResponseRepository;
  rerun_url: string;
  run_number: number;
  status: ActionsStatus;
  updated_at: string;
  url: string;
  workflow_url: string;
};

export interface WorkflowSummaryInterface {
  jobs: Array<ActionsListJobsForWorkflowRunResponseJobsItem>;
  workflow: ActionsGetWorkflowRunResponse;
}
