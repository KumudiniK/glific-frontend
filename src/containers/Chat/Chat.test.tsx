import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render } from '@testing-library/react';
import { Chat } from './Chat';
import { setUserSession } from '../../services/AuthService';

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { SEARCH_QUERY } from '../../graphql/queries/Search';
import { DEFAULT_CONTACT_LIMIT, DEFAULT_MESSAGE_LIMIT } from '../../common/constants';

// add mock for the resize observer
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

const cache = new InMemoryCache({ addTypename: false });
cache.writeQuery({
  query: SEARCH_QUERY,
  variables: {
    contactOpts: { limit: DEFAULT_CONTACT_LIMIT },
    filter: {},
    messageOpts: { limit: DEFAULT_MESSAGE_LIMIT },
  },
  data: {
    search: [
      {
        group: null,
        contact: {
          id: '2',
          name: 'Effie Cormier',
          phone: '987654321',
          maskedPhone: '98****321',
          lastMessageAt: '2020-06-29T09:31:47Z',
          status: 'VALID',
          bspStatus: 'SESSION_AND_HSM',
          isOrgRead: true,
        },
        messages: [
          {
            id: '1',
            body: 'Hey there whats up?',
            insertedAt: '2020-06-25T13:36:43Z',
            location: null,
            messageNumber: 48,
            receiver: {
              id: '1',
            },
            sender: {
              id: '2',
            },
            tags: [
              {
                id: '1',
                label: 'important',
                colorCode: '#00d084',
              },
            ],
            type: 'TEXT',
            media: null,
            errors: '{}',
          },
        ],
      },
    ],
  },
});

const client = new ApolloClient({
  cache: cache,
  assumeImmutableResults: true,
});

const defaultProps = {
  contactId: 2,
};

window.HTMLElement.prototype.scrollIntoView = function () {};

afterEach(cleanup);

const wrapper = (
  <ApolloProvider client={client}>
    <MemoryRouter>
      <Chat {...defaultProps} />
    </MemoryRouter>
  </ApolloProvider>
);

// set user session
setUserSession(JSON.stringify({ organization: { id: '1' } }));

describe('<Chat />', () => {
  test('it should render <Chat /> component correctly', async () => {
    const { findAllByText, getByText, findByTestId } = render(wrapper);

    // loading is show initially
    expect(getByText('Loading...')).toBeInTheDocument();
    // check if chat conversations are displayed
    const ChatConversation = await findByTestId('beneficiaryName');
    expect(ChatConversation).toHaveTextContent('Effie Cormier');

    // check if tags are displayed in the ChatMessages
    const ConversationTag = await findAllByText('important');
    expect(ConversationTag[0]).toBeInTheDocument();
  });

  test('check condition when no subscription data provided', async () => {
    const { getByText, findByTestId } = render(wrapper);

    expect(getByText('Loading...')).toBeInTheDocument();

    const ChatConversation = await findByTestId('beneficiaryName');
    expect(ChatConversation).toHaveTextContent('Effie Cormier');
  });
});
