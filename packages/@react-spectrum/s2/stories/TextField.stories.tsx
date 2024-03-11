import {Form} from 'react-aria-components';
import {TextArea, TextField} from '../src/TextField';

import type {Meta} from '@storybook/react';
import {Button} from '../src/Button';
import {style} from '../style-macro/spectrum-theme' with {type: 'macro'};

const meta: Meta<typeof TextField> = {
  component: TextField,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;

export const Example = (args: any) => <TextField {...args} />;

Example.args = {
  label: 'Name'
};

export const Validation = (args: any) => (
  <Form>
    <TextField {...args} />
    <Button type="submit" variant="primary">Submit</Button>
  </Form>
);

Validation.args = {
  ...Example.args,
  isRequired: true
};

export const TextAreaExample = (args: any) => <TextArea {...args} />;
TextAreaExample.args = {
  label: 'Comment'
};

export const CustomWidth = (args: any) => <TextField {...args} css={style({width: 208})} />;

CustomWidth.args = {
  label: 'Name'
};
