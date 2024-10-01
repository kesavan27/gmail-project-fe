import { useContext, useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import PropTypes from "prop-types";
import { EmailContext } from "../context/EmailContext";
import { jwtDecode } from "jwt-decode";
import { sendEmail } from "../apis/emails/sendEmail";
import { draftEmail } from "../apis/emails/draftEmail";
import { nanoid } from "nanoid";

// Basic email validation regex for checking general email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ComposeEmail = ({ show, handleClose, draftData }) => {
  const { state, dispatch } = useContext(EmailContext);
  const [to, setTo] = useState(draftData?.to || "");
  const [cc, setCc] = useState(draftData?.cc || "");
  const [bcc, setBcc] = useState(draftData?.bcc || "");
  const [subject, setSubject] = useState(draftData?.subject || "");
  const [body, setBody] = useState(draftData?.body || "");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendDisabled, setSendDisabled] = useState(true);
  const [invalidEmails, setInvalidEmails] = useState({
    to: [],
    cc: [],
    bcc: [],
  });
  const [backendError, setBackendError] = useState(null);

  const { email } = jwtDecode(localStorage.getItem("token"));

  useEffect(() => {
    if (draftData) {
      const draftEmail = state.drafts.emails.find(
        (email) => email.id === draftData
      );

      setTo(draftEmail?.to || "");
      setCc(draftEmail?.cc || "");
      setBcc(draftEmail?.bcc || "");
      setSubject(draftEmail?.subject || "");
      setBody(draftEmail?.body || "");
    }
  }, [draftData, state.drafts.emails]);

  const handleDraftSave = async () => {
    const newEmail = {
      id: draftData,
      from: email,
      to,
      cc,
      bcc,
      subject,
      body,
    };

    try {
      await draftEmail(newEmail);
    } catch (error) {
      console.error("Failed to save draft email:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEmail = {
      id: nanoid(10),
      from: email,
      to,
      cc,
      bcc,
      subject,
      body,
    };

    try {
      const savedEmail = await sendEmail(newEmail);
      dispatch({ type: "ADD_EMAIL", folder: "sent", payload: savedEmail });
      handleClose();
      clearForm();
    } catch (error) {
      console.error("Failed to send email:", error);
      setBackendError(error?.response?.data?.msg || "Failed to send email.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "to") setTo(value);
    else if (name === "cc") setCc(value);
    else if (name === "bcc") setBcc(value);

    validateAllEmails();
  };

  const validateAllEmails = () => {
    const toValidation = validateEmails("to");
    const ccValidation = validateEmails("cc");
    const bccValidation = validateEmails("bcc");

    setSendDisabled(!(toValidation && ccValidation && bccValidation));
  };

  const validateEmails = (field) => {
    let emails = "";
    switch (field) {
      case "to":
        emails = to;
        break;
      case "cc":
        emails = cc;
        break;
      case "bcc":
        emails = bcc;
        break;
      default:
        emails = "";
    }

    const emailList = emails
      .split(";")
      .map((email) => email.trim())
      .filter(Boolean);

    const invalidEmailList = emailList.filter((email) => !emailRegex.test(email));

    setInvalidEmails((prevInvalidEmails) => ({
      ...prevInvalidEmails,
      [field]: invalidEmailList,
    }));

    return invalidEmailList.length === 0;
  };

  const clearForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Compose Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {backendError && <Alert variant="danger">{backendError}</Alert>}
          <Form.Group controlId="to">
            <Form.Label>To:</Form.Label>
            <Form.Control
              type="text"
              name="to"
              placeholder="Enter recipient email(s) separated by semicolon"
              value={to}
              onChange={handleInputChange}
              isInvalid={invalidEmails.to.length > 0}
              required
            />
            {invalidEmails.to.length > 0 && (
              <Alert variant="danger">
                Invalid Emails: {invalidEmails.to.join(", ")}
              </Alert>
            )}
          </Form.Group>
          <Button
            variant="link"
            onClick={() => setShowCcBcc(!showCcBcc)}
            aria-controls="cc-bcc-fields"
            aria-expanded={showCcBcc}
          >
            {showCcBcc ? "Hide Cc/Bcc" : "Show Cc/Bcc"}
          </Button>
          {showCcBcc && (
            <>
              <Form.Group controlId="cc">
                <Form.Label>Cc:</Form.Label>
                <Form.Control
                  type="text"
                  name="cc"
                  placeholder="Enter CC email(s) separated by semicolon"
                  value={cc}
                  onChange={handleInputChange}
                  isInvalid={invalidEmails.cc.length > 0}
                />
                {invalidEmails.cc.length > 0 && (
                  <Alert variant="danger">
                    Invalid Emails: {invalidEmails.cc.join(", ")}
                  </Alert>
                )}
              </Form.Group>
              <Form.Group controlId="bcc">
                <Form.Label>Bcc:</Form.Label>
                <Form.Control
                  type="text"
                  name="bcc"
                  placeholder="Enter BCC email(s) separated by semicolon"
                  value={bcc}
                  onChange={handleInputChange}
                  isInvalid={invalidEmails.bcc.length > 0}
                />
                {invalidEmails.bcc.length > 0 && (
                  <Alert variant="danger">
                    Invalid Emails: {invalidEmails.bcc.join(", ")}
                  </Alert>
                )}
              </Form.Group>
            </>
          )}
          <Form.Group controlId="subject">
            <Form.Label>Subject:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="body">
            <Form.Label>Body:</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Enter email body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={async () => {
              await handleDraftSave();
              handleClose();
            }}
          >
            Save Draft
          </Button>
          <Button variant="primary" type="submit" disabled={sendDisabled}>
            Send
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

ComposeEmail.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  draftData: PropTypes.string,
};

export default ComposeEmail;
