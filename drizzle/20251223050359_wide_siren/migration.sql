CREATE TYPE "character_type" AS ENUM('hero', 'enemy');--> statement-breakpoint
CREATE TYPE "context_type" AS ENUM('attack', 'heal', 'buff', 'debuff', 'damage', 'turn_start', 'turn_end');--> statement-breakpoint
CREATE TABLE "abilities" (
	"id" varchar(255) PRIMARY KEY,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"context_type" "context_type" NOT NULL,
	"cooldown" integer
);
--> statement-breakpoint
CREATE TABLE "character_types" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"image_url" text,
	"level_two_ability_id" text,
	"level_three_ability_id" text,
	"base_stats" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY,
	"type" "character_type" NOT NULL,
	"character_type_id" integer NOT NULL,
	"stats" jsonb NOT NULL,
	"level" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"character_ids" jsonb DEFAULT '[]' NOT NULL,
	"boss_level" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY,
	"age" integer
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_character_type_id_character_types_id_fkey" FOREIGN KEY ("character_type_id") REFERENCES "character_types"("id") ON DELETE CASCADE;