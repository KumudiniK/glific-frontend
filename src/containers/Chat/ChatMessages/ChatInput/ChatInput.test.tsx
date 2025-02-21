import React from 'react';
import ChatInput from './ChatInput';
import { MockedProvider } from '@apollo/client/testing';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { TEMPLATE_MOCKS } from '../../../../mocks/Template';

const mocks = TEMPLATE_MOCKS;

// add mock for the resize observer
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe('<ChatInput />', () => {
  let inputSubmitted = false;
  const onSendMessageHandler = () => {
    inputSubmitted = true;
  };
  const handleHeightChange = jest.fn();

  beforeEach(() => {
    inputSubmitted = false;
  });

  const defaultProps = {
    onSendMessage: onSendMessageHandler,
    handleHeightChange: handleHeightChange,
    contactStatus: 'VALID',
    contactBspStatus: 'SESSION_AND_HSM',
  };

  const chatInput = (
    <MockedProvider mocks={mocks} addTypename={false}>
      <ChatInput {...defaultProps} />
    </MockedProvider>
  );

  test('it should render the input element', () => {
    const { getByTestId } = render(chatInput);
    expect(getByTestId('message-input-container')).toBeInTheDocument();
  });

  test('speed send and template buttons should exist', () => {
    const { getAllByTestId } = render(chatInput);
    expect(getAllByTestId('shortcutButton')).toHaveLength(2);
  });

  test('it should not be able to submit without any message', () => {
    const { getByTestId } = render(chatInput);
    fireEvent.click(getByTestId('sendButton'));
    expect(inputSubmitted).toBeFalsy();
  });

  test('chat templates should open when either speed send or templates button is clicked', async () => {
    // Speed sends button
    const { getAllByTestId, getByTestId, queryByTestId } = render(chatInput);
    fireEvent.click(getAllByTestId('shortcutButton')[0]);
    await waitFor(() => {
      expect(getByTestId('chatTemplates')).toBeInTheDocument();
    });
    fireEvent.click(getAllByTestId('shortcutButton')[0]);
    expect(queryByTestId('chatTemplates')).toBe(null);

    // Templates button

    fireEvent.click(getAllByTestId('shortcutButton')[1]);
    await waitFor(() => {
      expect(getByTestId('chatTemplates')).toBeInTheDocument();
    });
    fireEvent.click(getAllByTestId('shortcutButton')[1]);
    expect(queryByTestId('chatTemplates')).toBe(null);
  });

  test('check if reset button works', async () => {
    const { getAllByTestId, getByTestId } = render(chatInput);

    fireEvent.click(getAllByTestId('shortcutButton')[0]);

    await waitFor(() => {
      fireEvent.change(getByTestId('searchInput').querySelector('input'), {
        target: { value: 'hi' },
      });
    });
    await waitFor(() => {
      fireEvent.click(getByTestId('resetButton'));
    });
  });

  test('clicking on a speed send from the list should store the value as input', async () => {
    const { getAllByTestId } = render(chatInput);
    const speedSends = getAllByTestId('shortcutButton')[0];
    fireEvent.click(speedSends);
    await waitFor(() => {
      const listItem = getAllByTestId('templateItem')[0];
      fireEvent.click(listItem);
    });
  });

  test('when bsp status is none', async () => {
    const propsWithBspStatusNone = defaultProps;
    propsWithBspStatusNone.contactBspStatus = 'NONE';
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChatInput {...propsWithBspStatusNone} />
      </MockedProvider>
    );

    expect(
      getByText(
        'Sorry, chat is unavailable with this contact at this moment because they aren’t opted in to your number.'
      )
    ).toBeInTheDocument();
  });

  test('when bsp status is HSM', async () => {
    const propsWithBspStatusHSM = defaultProps;
    propsWithBspStatusHSM.contactBspStatus = 'HSM';
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChatInput {...propsWithBspStatusHSM} />
      </MockedProvider>
    );
    expect(getByText('Templates')).toBeInTheDocument();
  });

  test('when bsp status is SESSION', async () => {
    const propsWithBspStatusSession = defaultProps;
    propsWithBspStatusSession.contactBspStatus = 'SESSION';
    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChatInput {...propsWithBspStatusSession} />
      </MockedProvider>
    );
    expect(getByText('Speed sends')).toBeInTheDocument();
  });

  test('24 hour window gets over', async () => {
    const propsWithChatWindowOver: any = defaultProps;
    const date = new Date();
    date.setDate(date.getDate() - 2);
    propsWithChatWindowOver.lastMessageTime = date;

    const { getByText } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChatInput {...propsWithChatWindowOver} />
      </MockedProvider>
    );
    expect(getByText('Templates')).toBeInTheDocument();
  });
});
