-- Create the conditions table
create table conditions (
  id text primary key,
  name text not null,
  locations text[] not null,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table conditions enable row level security;

-- Create a policy that allows anyone to read conditions
create policy "Public conditions are viewable by everyone"
  on conditions for select
  using ( true );

-- Create a policy that allows authenticated users (service role) to insert/update
-- For simplicity in this "manual" setup, we might allow public insert if you are running the seed script from client
-- BUT SECURELY: You should use the SERVICE_ROLE key for seeding.
-- For now, let's allow public insert for the initial setup ease, then you should disable it.
create policy "Allow insert for everyone (TEMPORARY FOR SEEDING)"
  on conditions for insert
  with check ( true );
