-- Add section_summaries column to lectures table
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS section_summaries JSONB[];

-- Add comment to explain the column
COMMENT ON COLUMN lectures.section_summaries IS 'Array of JSON objects containing section-by-section summaries of the lecture transcript. Each object includes timestamp_marker, main_topics, key_points, examples, and summary.'; 