import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import moment from 'moment';

import styles from './FlowList.module.css';
import { ReactComponent as FlowIcon } from '../../../assets/images/icons/Flow/Dark.svg';
import { ReactComponent as DuplicateIcon } from '../../../assets/images/icons/Flow/Duplicate.svg';
import { ReactComponent as ConfigureIcon } from '../../../assets/images/icons/Configure/UnselectedDark.svg';
import { ReactComponent as WebhookLogsIcon } from '../../../assets/images/icons/Webhook/WebhookLight.svg';
import { ReactComponent as NotificationIcon } from '../../../assets/images/icons/Notification/ErrorLogs.svg';
import { List } from '../../List/List';
import { FILTER_FLOW, GET_FLOWS, GET_FLOW_COUNT } from '../../../graphql/queries/Flow';
import { DELETE_FLOW } from '../../../graphql/mutations/Flow';
import { setVariables, DATE_TIME_FORMAT } from '../../../common/constants';

export interface FlowListProps {}

const getName = (text: string, keywordsList: any) => {
  const keywords = keywordsList.map((keyword: any) => keyword);

  return (
    <p className={`${styles.TableText} ${styles.NameText}`}>
      {text}
      <br />
      <div className={styles.Keyword}>{keywords.join(', ')}</div>
    </p>
  );
};

const getDate = (date: string, fallback: string = '') => (
  <div className={styles.LastPublished}>
    {date ? moment(date).format(DATE_TIME_FORMAT) : fallback}
  </div>
);

const getColumns = ({ name, keywords, lastChangedAt, lastPublishedAt }: any) => ({
  name: getName(name, keywords),
  lastPublishedAt: getDate(lastPublishedAt, 'Not published yet'),
  lastChangedAt: getDate(lastChangedAt, 'Nothing in draft'),
});

const columnNames = ['NAME', 'LAST PUBLISHED', 'LAST SAVED IN DRAFT', 'ACTIONS'];
const dialogMessage = "You won't be able to use this flow.";
const columnStyles = [styles.Name, styles.LastPublished, styles.LastDraft, styles.Actions];
const flowIcon = <FlowIcon className={styles.FlowIcon} />;

const queries = {
  countQuery: GET_FLOW_COUNT,
  filterItemsQuery: FILTER_FLOW,
  deleteItemQuery: DELETE_FLOW,
};

const columnAttributes = {
  columnNames,
  columns: getColumns,
  columnStyles,
};

const configureIcon = <ConfigureIcon />;

export const FlowList: React.SFC<FlowListProps> = () => {
  const history = useHistory();

  const setDialog = (id: any) => {
    history.push({ pathname: `/flow/${id}/edit`, state: 'copy' });
  };

  const additionalAction = [
    {
      label: 'Configure',
      icon: configureIcon,
      parameter: 'uuid',
      link: '/flow/configure',
    },
    {
      label: 'Make a copy',
      icon: <DuplicateIcon />,
      parameter: 'id',
      dialog: setDialog,
    },
  ];

  return (
    <>
      <List
        title="Flows"
        listItem="flows"
        listItemName="flow"
        pageLink="flow"
        listIcon={flowIcon}
        dialogMessage={dialogMessage}
        refetchQueries={{ query: GET_FLOWS, variables: setVariables() }}
        {...queries}
        {...columnAttributes}
        searchParameter="name"
        removeSortBy={['LAST PUBLISHED', 'LAST SAVED IN DRAFT']}
        additionalAction={additionalAction}
        button={{ show: true, label: '+ CREATE FLOW' }}
      />

      <Link to="/webhook-logs" className={styles.Webhook}>
        <WebhookLogsIcon />
        View webhook logs
      </Link>
      <Link to="/notifications" className={styles.Notifications}>
        <NotificationIcon />
        View Notifications
      </Link>
    </>
  );
};
