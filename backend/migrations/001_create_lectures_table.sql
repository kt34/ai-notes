-- Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    transcript TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Add foreign key constraint to auth.users
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own lectures
CREATE POLICY "Users can only view their own lectures"
    ON lectures
    FOR ALL
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lectures_updated_at
    BEFORE UPDATE
    ON lectures
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 