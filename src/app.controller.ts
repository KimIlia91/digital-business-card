import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  /** The deployed URL opens straight into Apollo Sandbox. */
  @Get()
  @Redirect('/graphql', 302)
  root(): void {}
}
