#!/usr/bin/env python3
"""
Script to create Supabase tables for portfolio caching.
Run this once to set up the database schema.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Note: Supabase Python client doesn't support direct SQL execution
# You need to run the SQL in Supabase dashboard SQL editor

print("=" * 60)
print("SUPABASE TABLE SETUP INSTRUCTIONS")
print("=" * 60)
print("\n1. Go to your Supabase dashboard:")
print(f"   {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}")
print("\n2. Click on 'SQL Editor' in the left sidebar")
print("\n3. Click 'New Query'")
print("\n4. Copy and paste the contents of 'supabase_schema.sql'")
print("\n5. Click 'Run' to execute the SQL")
print("\n" + "=" * 60)
print("\nAlternatively, you can use psql:")
print(f"psql {os.getenv('DATABASE_URL')} < supabase_schema.sql")
print("=" * 60)
