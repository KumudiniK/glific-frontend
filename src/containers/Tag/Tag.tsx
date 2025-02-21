import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useQuery, useLazyQuery } from '@apollo/client';

import styles from './Tag.module.css';
import { Input } from '../../components/UI/Form/Input/Input';
import { FILTER_TAGS_NAME, GET_TAG, GET_TAGS } from '../../graphql/queries/Tag';
import { UPDATE_TAG, CREATE_TAG, DELETE_TAG } from '../../graphql/mutations/Tag';
import { FormLayout } from '../Form/FormLayout';
import { ReactComponent as TagIcon } from '../../assets/images/icons/Tags/Selected.svg';
import { AutoComplete } from '../../components/UI/Form/AutoComplete/AutoComplete';
import { Loading } from '../../components/UI/Layout/Loading/Loading';
import { ColorPicker } from '../../components/UI/ColorPicker/ColorPicker';
import { setVariables } from '../../common/constants';
import { getObject } from '../../common/utils';

export interface TagProps {
  match: any;
}

const FormSchema = Yup.object().shape({
  label: Yup.string().required('Title is required.').max(50, 'Title is too long.'),
  description: Yup.string().required('Description is required.'),
});

const dialogMessage = "You won't be able to use this for tagging messages.";

const tagIcon = <TagIcon className={styles.TagIcon} />;

const queries = {
  getItemQuery: GET_TAG,
  createItemQuery: CREATE_TAG,
  updateItemQuery: UPDATE_TAG,
  deleteItemQuery: DELETE_TAG,
};

const formFields = (validateTitle: any, tags: any, colorCode: string) => [
  {
    component: Input,
    name: 'label',
    type: 'text',
    placeholder: 'Title',
    validate: validateTitle,
  },
  {
    component: Input,
    name: 'description',
    type: 'text',
    placeholder: 'Description',
    rows: 3,
    textArea: true,
  },
  {
    component: Input,
    name: 'keywords',
    type: 'text',
    placeholder: 'Keywords',
    rows: 3,
    helperText: 'Use commas to separate the keywords',
    textArea: true,
  },
  {
    component: AutoComplete,
    name: 'parentId',
    placeholder: 'Parent tag',
    options: tags,
    optionLabel: 'label',
    multiple: false,
    textFieldProps: {
      label: 'Parent tag',
      variant: 'outlined',
    },
  },
  {
    component: ColorPicker,
    name: 'colorCode',
    colorCode,
    helperText: 'Tag color',
  },
];

export const Tag: React.SFC<TagProps> = ({ match }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [colorCode, setColorCode] = useState('#0C976D');
  const [parentId, setParentId] = useState<any>([]);
  const [filterLabel, setFilterLabel] = useState('');
  const [languageId, setLanguageId] = useState('');

  const states = { label, description, keywords, colorCode, parentId };

  const { data } = useQuery(GET_TAGS, {
    variables: setVariables(),
  });

  const [getTags, { data: dataTag }] = useLazyQuery<any>(GET_TAGS, {
    variables: {
      filter: { label: filterLabel, languageId: parseInt(languageId, 10) },
    },
  });

  const setStates = ({
    label: labelValue,
    description: descriptionValue,
    keywords: keywordsValue,
    colorCode: colorCodeValue,
    parent: parentValue,
  }: any) => {
    setLabel(labelValue);
    setDescription(descriptionValue);
    setKeywords(keywordsValue);
    setColorCode(colorCodeValue);
    if (parentValue) {
      setParentId(getObject(data.tags, [parentValue.id])[0]);
    }
  };

  useEffect(() => {
    if (filterLabel && languageId) getTags();
  }, [filterLabel, languageId, getTags]);

  if (!data) return <Loading />;

  let tags = [];
  if (data) {
    tags = data.tags;
    // remove the self tag from list
    if (data && match && match.params.id) {
      tags = data.tags.filter((tag: any) => tag.id !== match.params.id);
    }
  }

  const validateTitle = (value: any) => {
    let error;
    if (value) {
      setFilterLabel(value);
      let found = [];
      if (dataTag) {
        // need to check exact title
        found = dataTag.tags.filter((search: any) => search.label === value);
        if (match.params.id && found.length > 0) {
          found = found.filter((search: any) => search.id !== match.params.id);
        }
      }
      if (found.length > 0) {
        error = 'Title already exists.';
      }
    }
    return error;
  };

  const getLanguageId = (value: any) => {
    setLanguageId(value);
  };

  const setPayload = (payload: any) => {
    const payloadCopy = payload;
    if (payloadCopy.parentId) {
      payloadCopy.parentId = payloadCopy.parentId.id;
    }
    return payloadCopy;
  };

  return (
    <FormLayout
      {...queries}
      match={match}
      refetchQueries={[
        {
          query: FILTER_TAGS_NAME,
          variables: setVariables(),
        },
      ]}
      states={states}
      setStates={setStates}
      setPayload={setPayload}
      validationSchema={FormSchema}
      listItemName="tag"
      dialogMessage={dialogMessage}
      formFields={formFields(validateTitle, tags, colorCode)}
      redirectionLink="tag"
      listItem="tag"
      icon={tagIcon}
      getLanguageId={getLanguageId}
    />
  );
};
