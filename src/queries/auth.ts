import { gql } from '@apollo/client';

const authDataFragment = gql`
  fragment authData on AuthResponse {
    user {
      id
      username
      email
      googleId
      facebookId
    }
    notifications {
      id
      groupName
      emails
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($user: Auth!) {
    registerUser(user: $user) {
      ...authData
    }
  }
  ${authDataFragment}
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      ...authData
    }
  }
  ${authDataFragment}
`;

export const AUTH_SOCIAL_USER = gql`
  mutation AuthSocialUser($user: Auth!) {
    authSocialUser(user: $user) {
      ...authData
    }
  }
  ${authDataFragment}
`;

export const CHECK_CURRENT_USER = gql`
  query CheckCurrentUser {
    checkCurrentUser {
      user {
        id
        username
        email
        googleId
        facebookId
      }
      notifications {
        id
        groupName
        emails
      }
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation {
    logout {
      message
    }
  }
`;