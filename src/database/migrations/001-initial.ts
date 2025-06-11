import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1703000000000 implements MigrationInterface {
  name = 'Initial1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" SERIAL NOT NULL,
        "client_id" character varying NOT NULL,
        "client_secret" character varying NOT NULL,
        "client_name" character varying NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_client_id" UNIQUE ("client_id"),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "client_access_tokens" (
        "id" SERIAL NOT NULL,
        "token" character varying NOT NULL,
        "client_id" integer NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_client_access_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_client_access_tokens_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "client_access_tokens"`);
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}
