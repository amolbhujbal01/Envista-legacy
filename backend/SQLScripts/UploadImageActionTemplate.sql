USE envista;

-- Insert into Procedure_Actions
SELECT * FROM ProcedureActions;
INSERT INTO ProcedureActions (action_name, sequence_id, isUploadRequired, fileExtension, isApproveRequired, isSentToLab, isMentorReviewRequired, isOrderConsumables)
VALUES
('Upload CBCT', 1, TRUE, 'cbct', FALSE, FALSE, FALSE, FALSE),
('Upload STL U', 2, TRUE, 'stl', FALSE, FALSE, FALSE, FALSE),
('Upload STL L', 3, TRUE, 'stl', FALSE, FALSE, FALSE, FALSE);

-- Insert into Procedure
SELECT * FROM ProcedureTemplate;
INSERT INTO ProcedureTemplate (procedure_id, procedure_action_id, procedure_name, sequence_id)
VALUES
(1, 1, 'Upload Image', 1),
(1, 2, 'Upload Image', 2),
(1, 3, 'Upload Image', 3);

-- Insert into Procedure_Map
SELECT * FROM ProcedureMap;
INSERT INTO ProcedureMap (step_id, procedure_id)
VALUES
(1, 1);

--------------------------------------------------------------------- APPROVE TEMPLATE -------------------------------------------------------------
-- Insert into Procedure_Actions
SELECT * FROM ProcedureActions;
INSERT INTO ProcedureActions (action_name, isUploadRequired, fileExtension, isApproveRequired, isSentToLab, isMentorReviewRequired, isOrderConsumables)
VALUES
('Approval', FALSE, NULL, TRUE, FALSE, FALSE, FALSE);

-- Insert into Procedure
SELECT * FROM ProcedureTemplate;
INSERT INTO ProcedureTemplate (procedure_id, procedure_action_id, procedure_name, sequence_id)
VALUES
(2, 4, 'Approve', 1);

-- Insert into Procedure_Map
SELECT * FROM ProcedureMap;
INSERT INTO ProcedureMap (step_id, procedure_id)
VALUES
(2, 2);

SELECT * FROM StageItem; 
INSERT INTO StageItem ( stage_id, sequence_id, name, description)
VALUES 
(1, 1, 'Upload Images', ''),
( 2, 1, 'Integration and manual upload for sending scans to Smiley', ''),
( 2, 2, 'Approve / Reject or Resend scans', ''),
( 2, 3, 'Confirm 3D printing done (get a POP object)', ''),
( 3, 1, 'Temp prosthetic design', ''),
( 3, 2, 'Manufacture Temporary Prosthetics', ''),
( 4, 1, 'Surgery Plan', ''),
( 4, 2, 'Review by mentor and Approval by planning and add review comments', ''),
( 4, 3, 'Order Consumables', ''),
( 4, 4, 'Design Surgical template', ''),
( 4, 5, 'Manufacture template', ''),
( 5, 1, 'Upload Patient Photos', '');




