import React, { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useQuery } from '@apollo/client';
import { useHistory } from 'react-router-dom';

import { Input } from '../../components/UI/Form/Input/Input';
import { FormLayout } from '../Form/FormLayout';
import { AutoComplete } from '../../components/UI/Form/AutoComplete/AutoComplete';
import { Loading } from '../../components/UI/Layout/Loading/Loading';
import { GET_USERS_QUERY, GET_USER_ROLES } from '../../graphql/queries/User';
import { UPDATE_USER, DELETE_USER } from '../../graphql/mutations/User';
import { GET_COLLECTIONS } from '../../graphql/queries/Collection';
import { ReactComponent as StaffManagementIcon } from '../../assets/images/icons/StaffManagement/Active.svg';
import { getUserRole, isManagerRole } from '../../context/role';
import { setVariables } from '../../common/constants';
import { Checkbox } from '../../components/UI/Form/Checkbox/Checkbox';
import { DialogBox } from '../../components/UI/DialogBox/DialogBox';
import styles from './StaffManagement.module.css';
import { getUserSession } from '../../services/AuthService';

export interface StaffManagementProps {
  match: any;
}

const dialogMessage = ' Once deleted this action cannot be undone.';

const staffManagementIcon = <StaffManagementIcon />;

const queries = {
  getItemQuery: GET_USERS_QUERY,
  createItemQuery: UPDATE_USER,
  updateItemQuery: UPDATE_USER,
  deleteItemQuery: DELETE_USER,
};

export const StaffManagement: React.SFC<StaffManagementProps> = ({ match }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<any>({});
  const [groups, setGroups] = useState([]);
  const [isRestricted, setIsRestricted] = useState(false);
  const [staffRole, setStaffRole] = useState(false);
  const [helpDialog, setHelpDialog] = useState(false);
  const [isAdmin] = useState(getUserRole().includes('Admin'));
  const history = useHistory();

  let dialog;

  if (helpDialog) {
    const rolesHelp = [
      {
        key: 1,
        title: 'Admin',
        description: 'Complete access to all the parts of the platform.',
      },
      {
        key: 2,
        title: 'Manager',
        description: 'Complete access to the platform except settings and staff management.',
      },
      {
        key: 3,
        title: 'Staff',
        description: `Access only to the chat section and their collections. Access can be limited to chatting
       with all contacts or only to the ones in their assigned collection.`,
      },
      { key: 4, title: 'None', description: 'No access to the platform. They can’t login.' },
    ];
    dialog = (
      <DialogBox
        titleAlign="left"
        title="User roles"
        skipOk
        buttonCancel="Close"
        handleCancel={() => setHelpDialog(false)}
      >
        {rolesHelp.map((role: any) => (
          <div className={styles.RolesHelp} key={role.key}>
            <span>{role.title}: </span>
            {role.description}
          </div>
        ))}
      </DialogBox>
    );
  }

  const states = { name, phone, roles, groups, isRestricted };
  const setStates = ({
    name: nameValue,
    phone: phoneValue,
    roles: rolesValue,
    groups: groupsValue,
    isRestricted: isRestrictedValue,
  }: any) => {
    setName(nameValue);
    setPhone(phoneValue);

    // let' format the roles so that it is displayed correctly in the UI
    if (rolesValue) {
      setRoles({ id: rolesValue[0], label: rolesValue[0] });
    }
    setGroups(groupsValue);
    setIsRestricted(isRestrictedValue);
  };

  const { loading: loadingRoles, data: roleData } = useQuery(GET_USER_ROLES);

  const { loading, data } = useQuery(GET_COLLECTIONS, {
    variables: setVariables(),
  });

  useEffect(() => {
    if (roles.id === 'Staff') {
      setStaffRole(true);
    }
  }, [roles]);

  if (loading || loadingRoles) return <Loading />;

  if (!data.groups || !roleData.roles) {
    return null;
  }

  const rolesList: any = [];
  if (roleData.roles) {
    roleData.roles.forEach((role: any) => {
      rolesList.push({ id: role, label: role });
    });
  }

  const getOptions = () => {
    let options: any = [];
    if (rolesList) {
      if (isManagerRole) {
        // should not display Admin role to manager.
        options = rolesList.filter((item: any) => item.label !== 'Admin');
      }
    }
    return options;
  };

  let formFields: any = [];

  const handleRolesChange = (value: any) => {
    if (value) {
      const hasStaffRole = value.label === 'Staff';
      if (hasStaffRole) {
        setStaffRole(true);
      } else {
        setStaffRole(false);
      }
    }
  };

  const handleHelpClick = () => {
    setHelpDialog(true);
  };

  formFields = [
    {
      component: Input,
      name: 'name',
      type: 'text',
      placeholder: 'Username',
    },
    {
      component: Input,
      name: 'phone',
      placeholder: 'Phone Number',
      disabled: true,
      skipPayload: true,
    },
    {
      component: AutoComplete,
      name: 'roles',
      disabled: isManagerRole,
      placeholder: 'Roles',
      options: rolesList,
      roleSelection: handleRolesChange,
      getOptions,
      helpLink: { label: 'help?', handleClick: handleHelpClick },
      optionLabel: 'label',
      multiple: false,
      textFieldProps: {
        label: 'Roles',
        variant: 'outlined',
      },
    },
    {
      component: AutoComplete,
      name: 'groups',
      placeholder: 'Assigned to collection(s)',
      options: data.groups,
      optionLabel: 'label',
      textFieldProps: {
        label: 'Assigned to collection(s)',
        variant: 'outlined',
      },
    },
  ];

  if (staffRole) {
    formFields = [
      ...formFields,
      {
        component: Checkbox,
        name: 'isRestricted',
        title: 'Can chat with contacts from assigned collection only',
      },
    ];
  }

  const FormSchema = Yup.object().shape({
    name: Yup.string().required('Name is required.'),
    phone: Yup.string().required('Phone is required'),
    roles: Yup.object().nullable().required('Roles is required'),
  });

  const setPayload = (payload: any) => {
    const payloadCopy = payload;
    // let's build the collectionIds, as backend expects the array of collection ids
    const collectionIds = payloadCopy.groups.map((collection: any) => collection.id);

    // remove collections from the payload
    delete payloadCopy.groups;

    let roleIds: any[] = [];
    // let's rebuild roles, as per backend
    if (payloadCopy.roles) roleIds = [payloadCopy.roles.id];

    // delete current roles from the payload
    delete payloadCopy.roles;

    // return modified payload
    return {
      ...payloadCopy,
      groupIds: collectionIds,
      roles: roleIds,
    };
  };

  const checkAfterSave = (updatedUser: any) => {
    const { id, roles: userRoles } = updatedUser.updateUser.user;
    if (isAdmin && getUserSession('id') === id && !userRoles.includes('Admin')) {
      history.push('/logout/user');
    }
  };

  return (
    <>
      {dialog}
      <FormLayout
        {...queries}
        match={match}
        afterSave={checkAfterSave}
        states={states}
        setStates={setStates}
        setPayload={setPayload}
        validationSchema={FormSchema}
        listItemName="User"
        dialogMessage={dialogMessage}
        formFields={formFields}
        redirectionLink="staff-management"
        listItem="user"
        icon={staffManagementIcon}
        languageSupport={false}
      />
    </>
  );
};
