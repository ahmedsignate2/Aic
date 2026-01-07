import React from 'react';
import { ScrollView } from 'react-native';

import { MalinCard, MalinText } from '../../MalinComponents';
import { MalinSpacing20 } from '../../components/MalinSpacing';

const Licensing = () => {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustContentInsets>
      <MalinCard>
        <MalinText>MIT License</MalinText>
        <MalinSpacing20 />
        <MalinText>Copyright (c) 2018-2024 MalinWallet developers</MalinText>
        <MalinSpacing20 />
        <MalinText>
          Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
          (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
          merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </MalinText>
        <MalinSpacing20 />

        <MalinText>
          The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
        </MalinText>
        <MalinSpacing20 />

        <MalinText>
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
          LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
          CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </MalinText>
      </MalinCard>
    </ScrollView>
  );
};

export default Licensing;
