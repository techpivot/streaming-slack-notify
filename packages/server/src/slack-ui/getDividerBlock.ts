import { DividerBlock } from '@slack/types';

const getDividerBlock = (): DividerBlock => {
  return {
    type: 'divider',
  };
};

export default getDividerBlock;
