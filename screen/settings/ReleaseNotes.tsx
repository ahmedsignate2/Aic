import React from 'react';
import { ScrollView } from 'react-native';

import { MalinCard, MalinText } from '../../MalinComponents';

const ReleaseNotes: React.FC = () => {
  const notes = require('../../release-notes');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustContentInsets>
      <MalinCard>
        <MalinText>{notes}</MalinText>
      </MalinCard>
    </ScrollView>
  );
};

export default ReleaseNotes;
