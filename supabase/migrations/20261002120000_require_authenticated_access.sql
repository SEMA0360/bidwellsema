DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('knowledge_base', 'kb_chunks', 'review_assignments', 'audit_trail', 'collaborators')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

CREATE POLICY "authenticated_access" ON knowledge_base
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_access" ON kb_chunks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_access" ON review_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_access" ON audit_trail
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_access" ON collaborators
  FOR ALL TO authenticated USING (true) WITH CHECK (true);