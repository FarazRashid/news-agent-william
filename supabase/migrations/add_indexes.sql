-- Add indexes for better query performance on news articles table
-- These indexes will significantly speed up filtering and sorting operations

-- Index on published_at for time-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);

-- Index on created_at for sorting by recency
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC);

-- Index on category for category-based filtering
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);

-- Index on primary_topic for topic-based filtering
CREATE INDEX IF NOT EXISTS idx_articles_primary_topic ON articles (primary_topic);

-- GIN index on tags array for topic filtering
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN (tags);

-- GIN index on secondary_topics array
CREATE INDEX IF NOT EXISTS idx_articles_secondary_topics ON articles USING GIN (secondary_topics);

-- GIN index on canonical_topics array
CREATE INDEX IF NOT EXISTS idx_articles_canonical_topics ON articles USING GIN (canonical_topics);

-- Composite index for common query patterns (published_at + category)
CREATE INDEX IF NOT EXISTS idx_articles_published_category ON articles (published_at DESC, category);

-- Composite index for published_at + primary_topic
CREATE INDEX IF NOT EXISTS idx_articles_published_topic ON articles (published_at DESC, primary_topic);
