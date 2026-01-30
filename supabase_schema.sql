-- Create gallery_folders table
CREATE TABLE IF NOT EXISTS gallery_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id to gallery_content if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gallery_content' AND column_name='folder_id') THEN
        ALTER TABLE gallery_content ADD COLUMN folder_id UUID REFERENCES gallery_folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;

-- Policies for gallery_folders
CREATE POLICY "Allow public read access on gallery_folders" ON gallery_folders
    FOR SELECT USING (true);

CREATE POLICY "Allow all access for authenticated users on gallery_folders" ON gallery_folders
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure gallery_content has correct policies for folder_id updates
-- (Assuming gallery_content already has RLS enabled and a policy for anon/authenticated access)
-- If not, you might need:
-- CREATE POLICY "Allow public read access on gallery_content" ON gallery_content FOR SELECT USING (true);
-- CREATE POLICY "Allow all access for authenticated users on gallery_content" ON gallery_content FOR ALL USING (true) WITH CHECK (true);
