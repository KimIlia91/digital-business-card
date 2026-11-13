import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Project from the portfolio' })
export class Project {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Link to the running project (demo, website, store page)',
  })
  url: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Link to the source code repository',
  })
  repositoryUrl: string | null;
}
