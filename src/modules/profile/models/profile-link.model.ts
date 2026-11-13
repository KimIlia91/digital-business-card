import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import type { LinkKind as DbLinkKind } from '../../../prisma/entities.js';

/** Declared in the API layer so a database change cannot silently alter the public contract. */
export const LinkKind = {
  GITHUB: 'GITHUB',
  LINKEDIN: 'LINKEDIN',
  TELEGRAM: 'TELEGRAM',
  EMAIL: 'EMAIL',
  WEBSITE: 'WEBSITE',
  OTHER: 'OTHER',
} as const satisfies { [K in DbLinkKind]: K };
export type LinkKind = (typeof LinkKind)[keyof typeof LinkKind];

registerEnumType(LinkKind, {
  name: 'LinkKind',
  description: 'Kind of a professional resource; lets clients pick an icon',
});

@ObjectType({
  description: 'Link to GitHub, LinkedIn or another professional resource',
})
export class ProfileLink {
  @Field(() => ID)
  id: number;

  @Field(() => LinkKind)
  kind: LinkKind;

  @Field(() => String, { description: 'Human-readable caption' })
  label: string;

  @Field(() => String)
  url: string;
}
