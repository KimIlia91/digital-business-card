import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Owner of the digital business card' })
export class Profile {
  @Field(() => ID)
  id: number;

  @Field(() => String, { description: 'Public identifier of the profile' })
  slug: string;

  @Field(() => String)
  name: string;

  @Field(() => String, {
    description: 'One-line professional title, e.g. "Backend Developer"',
  })
  headline: string;

  @Field(() => String, { description: 'Short "about me" text' })
  description: string;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'URL of the profile photo',
  })
  avatarUrl: string | null;
}
