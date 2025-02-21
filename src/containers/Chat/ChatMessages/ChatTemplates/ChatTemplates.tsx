import React from 'react';
import { useQuery } from '@apollo/client';
import { List, ListItem, Divider, Paper, Typography } from '@material-ui/core';

import styles from './ChatTemplates.module.css';
import { ReactComponent as AttachmentIconUnselected } from '../../../../assets/images/icons/Attachment/Attachment.svg';
import { FILTER_TEMPLATES } from '../../../../graphql/queries/Template';
import { WhatsAppToJsx } from '../../../../common/RichEditor';
import { setVariables } from '../../../../common/constants';

interface ChatTemplatesProps {
  searchVal: string;
  handleSelectText(obj: any): void;
  isTemplate: boolean; // Will need to change if search won't be just by 'speed send' or 'template'.
}

export const ChatTemplates: React.SFC<ChatTemplatesProps> = (props) => {
  const filterVariables = () => setVariables({ term: props.searchVal });

  const { loading, error, data } = useQuery<any>(FILTER_TEMPLATES, {
    variables: filterVariables(),
  });

  if (loading) return <div />;
  if (error || data.sessionTemplates === undefined) return <p>Error :(</p>;

  const getListItem = (obj: any, index: number) => {
    const key = index;
    return (
      <div key={key}>
        <ListItem
          data-testid="templateItem"
          button
          disableRipple
          onClick={() => props.handleSelectText(obj)}
          className={styles.PopperListItem}
        >
          <p className={styles.Text}>
            <b style={{ marginRight: '5px' }}>{obj.label}:</b>
            <span>{WhatsAppToJsx(obj.body)}</span>
          </p>
          {obj.MessageMedia ? (
            <div className={styles.AttachmentPin}>
              <AttachmentIconUnselected />
            </div>
          ) : null}
        </ListItem>
        <Divider light />
      </div>
    );
  };

  const popperItems = () => {
    const translationsObj: any = [];
    data.sessionTemplates.forEach((obj: any) => {
      const translations = JSON.parse(obj.translations);
      // add translation in list
      if (Object.keys(translations).length > 0) {
        Object.keys(translations).forEach((key) => {
          translationsObj.push(translations[key]);
        });
      }
    });
    const templateObj = [...data.sessionTemplates, ...translationsObj];
    const text = props.isTemplate ? 'templates' : 'speed sends';
    let listItems = templateObj.map((obj: any, index: number) => {
      if (obj.isHsm === props.isTemplate) {
        // True HSM === Template, False HSM === Speed send
        // Display only active & APPROVED template
        if (obj.isHsm && obj.isActive && obj.status === 'APPROVED') {
          return getListItem(obj, index);
        }
        if (!obj.isHsm) {
          return getListItem(obj, index);
        }
      }
      return null;
    });

    listItems = listItems.filter((n) => n);

    return listItems.length !== 0 ? (
      <List className={styles.ShortcutList}>
        <Paper elevation={0} className={styles.Paper}>
          {listItems}
        </Paper>
      </List>
    ) : (
      <Typography data-testid="no-results" align="center" variant="h6">
        No {text} for that search.
      </Typography>
    );
  };

  return (
    <div className={styles.ChatTemplates} data-testid="chatTemplates">
      {popperItems()}
    </div>
  );
};

export default ChatTemplates;
