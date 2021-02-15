import { gql } from '@apollo/client';

export const messageFragment = gql`
  fragment MyMessage on Message {
    id
    event {
      id #id should be for correct render
    }
  }
`;