-- One convoy row per checkpost, convoy and day. Stops a double-click (or two
-- officers) from starting the same convoy twice. addConveyControl() turns
-- the duplicate-key error into "Convey already started".
--
-- 1. Find existing duplicates first; the ALTER fails while any remain.
--    Keep one row of each group (fix trip references by hand if needed).
SELECT checkpostid, conveyid, `date`, COUNT(*) AS n, GROUP_CONCAT(id) AS ids
FROM convey_control
GROUP BY checkpostid, conveyid, `date`
HAVING n > 1;

-- 2. Add the constraint.
ALTER TABLE convey_control
  ADD UNIQUE KEY uq_convey_day (checkpostid, conveyid, `date`);
