import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import moment from 'moment';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { MARK_AS_READ } from '../../../../graphql/mutations/Chat';
import ChatConversation from './ChatConversation';
import { DATE_FORMAT } from '../../../../common/constants';

const mockCallback = jest.fn();

const mocks = [
  {
    request: {
      query: MARK_AS_READ,
      variables: {
        contactId: '1',
      },
    },
    result: {
      data: {
        markContactMessagesAsRead: ['2'],
      },
    },
  },
];

const insertedAt = '2020-06-19T18:44:02Z';
const defaultProps = {
  contactId: 1,
  contactName: 'Jane Doe',
  contactIsOrgRead: true,
  selected: true,
  index: 0,
  onClick: mockCallback,
  senderLastMessage: {
    body: 'Hey!',
    insertedAt,
  },
  lastMessage: {
    body: 'Hello there!',
    insertedAt,
    type: 'TEXT',
    tags: [
      {
        id: 1,
        label: 'Unread',
      },
    ],
  },
};

const wrapperContainer = (props: any) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <MemoryRouter>
      <ChatConversation {...props} />
    </MemoryRouter>
  </MockedProvider>
);

test('it should render the name correctly', () => {
  const { getByTestId } = render(wrapperContainer(defaultProps));
  expect(getByTestId('name')).toHaveTextContent('Jane Doe');
});

test('it should render the message content correctly', () => {
  const { getByTestId } = render(wrapperContainer(defaultProps));
  expect(getByTestId('content')).toHaveTextContent('Hello there!');
});

test('it should render the message date correctly', () => {
  const { getByTestId } = render(wrapperContainer(defaultProps));
  expect(getByTestId('date')).toHaveTextContent(moment(insertedAt).format(DATE_FORMAT));
});

test('it should call the callback function on click action', () => {
  const { getAllByTestId } = render(wrapperContainer(defaultProps));
  fireEvent.click(getAllByTestId('list')[0]);
  expect(mockCallback).toHaveBeenCalled();
});

test('check the condition with empty tags', () => {
  const propswithEmptyTags = { ...defaultProps };
  propswithEmptyTags.lastMessage.tags = [];
  const { container } = render(wrapperContainer(propswithEmptyTags));
  expect(container.querySelector('.ChatInfoRead')).toBeInTheDocument();
});
