import { Field, ID, ObjectType } from '@nestjs/graphql';
import { LocalDateScalar } from '../../../common/graphql/local-date.scalar.js';

@ObjectType({ description: 'Position in the work history' })
export class Experience {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  company: string;

  @Field(() => String)
  position: string;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => LocalDateScalar, { description: 'First day of the period' })
  startDate: Date;

  @Field(() => LocalDateScalar, {
    nullable: true,
    description: 'Last day of the period; null while the position is current',
  })
  endDate: Date | null;

  @Field(() => String, { nullable: true, description: 'Scope of the role' })
  summary: string | null;

  @Field(() => [String], { description: 'Key results achieved in the role' })
  achievements: string[];
}
