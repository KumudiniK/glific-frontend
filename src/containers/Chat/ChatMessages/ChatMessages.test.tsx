import React from 'react';
import { render, within } from '@testing-library/react';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { ChatMessages } from './ChatMessages';
import { fireEvent, waitFor } from '@testing-library/dom';
import { MemoryRouter } from 'react-router';
import { SEARCH_QUERY } from '../../../graphql/queries/Search';
import { DEFAULT_CONTACT_LIMIT, DEFAULT_MESSAGE_LIMIT } from '../../../common/constants';
import { MockedProvider } from '@apollo/client/testing';
import { CONVERSATION_MOCKS, mocksWithConversation } from '../../../mocks/Chat';
import * as ChatInput from '../ChatMessages/ChatInput/ChatInput';

// add mock for the resize observer
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

const body = {
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
};

const cache = new InMemoryCache({ addTypename: false });
export const searchQuery = {
  query: SEARCH_QUERY,
  variables: {
    filter: {},
    contactOpts: { limit: DEFAULT_CONTACT_LIMIT },
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
          lastMessageAt: new Date(),
          status: 'VALID',
          bspStatus: 'SESSION_AND_HSM',
          isOrgRead: true,
        },
        messages: [body],
      },
    ],
  },
};

cache.writeQuery(searchQuery);

const collection = {
  query: SEARCH_QUERY,
  variables: {
    contactOpts: { limit: DEFAULT_CONTACT_LIMIT },
    filter: { searchGroup: true },

    messageOpts: { limit: DEFAULT_MESSAGE_LIMIT },
  },
  data: {
    search: [
      {
        group: {
          id: '2',
          label: 'Default Group',
        },
        contact: null,
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
              id: '1',
            },
            tags: null,
            type: 'TEXT',
            media: null,
            errors: '{}',
          },
        ],
      },
    ],
  },
};
// add collection to apollo cache
cache.writeQuery(collection);

const client = new ApolloClient({
  cache: cache,
  assumeImmutableResults: true,
});
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const chatMessages = (
  <MemoryRouter>
    <ApolloProvider client={client}>
      <ChatMessages contactId="2" />
    </ApolloProvider>
  </MemoryRouter>
);

it('should have title as contact name', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    expect(getByTestId('beneficiaryName')).toHaveTextContent('Effie Cormier');
  });
});

it('should have an emoji picker', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    expect(getByTestId('emoji-picker')).toBeInTheDocument();
  });
});

it('should contain the mock message', async () => {
  const { getByText } = render(chatMessages);
  await waitFor(() => {
    expect(getByText('Hey there whats up?')).toBeInTheDocument();
  });
});

test('click on assign tag should open a dialog box with already assigned tags', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    fireEvent.click(getByTestId('messageOptions'));
  });

  fireEvent.click(getByTestId('dialogButton'));

  await waitFor(() => {
    expect(getByTestId('dialogBox')).toHaveTextContent('Assign tag to message');
  });
});

// need to check how to mock these

test('assigned tags should be shown in searchbox', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    fireEvent.click(getByTestId('messageOptions'));
  });

  fireEvent.click(getByTestId('dialogButton'));

  await waitFor(() => {
    const searchBox = within(getByTestId('AutocompleteInput'));
    expect(searchBox.getAllByText('Search'));
  });
});

// test('remove already assigned tags', async () => {
//   const { getByTestId } = render(chatMessages);
//   await wait();
//   await wait();
//   fireEvent.click(getByTestId('messageOptions'));
//   await wait();
//   act(() => {
//     fireEvent.click(getByTestId('dialogButton'));
//   });
//   await wait();
//   const searchBox = within(getByTestId('AutocompleteInput'));
//   fireEvent.click(searchBox.getByTestId('deleteIcon'));
// });

test('focus on the latest message', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    const message = getByTestId('message');
    expect(message.scrollIntoView).toBeCalled();
  });
});

test('cancel after dialog box open', async () => {
  const { getByText, getByTestId } = render(chatMessages);
  await waitFor(() => {
    fireEvent.click(getByTestId('messageOptions'));
    fireEvent.click(getByTestId('dialogButton'));
  });

  fireEvent.click(getByText('Cancel'));
});

test('click on Jump to latest', async () => {
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    fireEvent.click(getByTestId('jumpToLatest'));
  });
});

test('click on Jump to latest', async () => {
  const { getByTestId } = render(chatMessages);

  await waitFor(() => {
    fireEvent.click(getByTestId('jumpToLatest'));
  });
});

test('Contact: if not cache', async () => {
  const chatMessagesWithCollection = (
    <ApolloProvider client={client}>
      <MockedProvider mocks={[...CONVERSATION_MOCKS, ...mocksWithConversation]}>
        <ChatMessages contactId="5" />
      </MockedProvider>
    </ApolloProvider>
  );
  const { getByTestId } = render(chatMessagesWithCollection);
  // need to check this test
  // await waitFor(() => {
  //   fireEvent.click(getByTestId('jumpToLatest'));
  // });
});

const chatMessagesWithCollection = (
  <MemoryRouter>
    <ApolloProvider client={client}>
      <ChatMessages collectionId="2" />
    </ApolloProvider>
  </MemoryRouter>
);

it('should have title as group name', async () => {
  const { getByTestId } = render(chatMessagesWithCollection);
  await waitFor(() => {
    expect(getByTestId('beneficiaryName')).toHaveTextContent('Default Group');
  });
});

test('Collection: click on Jump to latest', async () => {
  const { getByTestId } = render(chatMessagesWithCollection);

  await waitFor(() => {
    fireEvent.click(getByTestId('jumpToLatest'));
  });
});

test('Collection: if not cache', async () => {
  const chatMessagesWithCollection = (
    <MockedProvider mocks={[...CONVERSATION_MOCKS, ...mocksWithConversation]}>
      <ChatMessages collectionId="5" />
    </MockedProvider>
  );
  const { getByTestId } = render(chatMessagesWithCollection);

  await waitFor(() => {
    fireEvent.click(getByTestId('jumpToLatest'));
  });
});

test('Collection: if cache', async () => {
  cache.writeQuery(collection);

  const client = new ApolloClient({
    cache: cache,
    assumeImmutableResults: true,
  });
  const chatMessagesWithCollection = (
    <ApolloProvider client={client}>
      <MockedProvider mocks={[...CONVERSATION_MOCKS, ...mocksWithConversation]}>
        <ChatMessages collectionId="5" />
      </MockedProvider>
    </ApolloProvider>
  );
  const { getByTestId } = render(chatMessagesWithCollection);
  await waitFor(() => {
    fireEvent.click(getByTestId('jumpToLatest'));
  });
});

test('click on Clear conversation', async () => {
  const chatMessages = (
    <ApolloProvider client={client}>
      <ChatMessages contactId="2" />
    </ApolloProvider>
  );
  const { getByTestId } = render(chatMessages);
  await waitFor(() => {
    fireEvent.click(getByTestId('dropdownIcon'));
    fireEvent.click(getByTestId('clearChatButton'));
    // need to check this
    // fireEvent.click(getByTestId('ok-button'));
    // expect(getByTestId('app')).toHaveTextContent('Conversation cleared for this contact');
  });
});

test('Load more messages', async () => {
  const searchQuery = {
    query: SEARCH_QUERY,
    variables: {
      filter: {},
      contactOpts: { limit: DEFAULT_CONTACT_LIMIT },
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
          messages: new Array(20).fill(body),
        },
      ],
    },
  };

  cache.writeQuery(searchQuery);
  const client = new ApolloClient({
    cache: cache,
    assumeImmutableResults: true,
  });

  const chatMessages = (
    <ApolloProvider client={client}>
      <ChatMessages contactId="2" />
    </ApolloProvider>
  );

  const { getByTestId } = render(chatMessages);

  await waitFor(() => {
    const container: any = document.querySelector('.messageContainer');
    fireEvent.scroll(container, { target: { scrollY: 0 } });
    fireEvent.click(getByTestId('loadMoreMessages'));
  });
});

test('send message to contact', async () => {
  const spy = jest.spyOn(ChatInput, 'ChatInput');

  spy.mockImplementation((props: any) => {
    const { onSendMessage } = props;
    return (
      <div
        data-testid="sendMessage"
        onClick={() => onSendMessage('hey', null, 'TEXT', null, null)}
      ></div>
    );
  });

  const { getByTestId } = render(chatMessages);

  await waitFor(() => {
    fireEvent.click(getByTestId('sendMessage'));
  });

  await waitFor(() => {});
});
