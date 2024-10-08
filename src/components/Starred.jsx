import { useContext, useEffect, useState } from "react";
import { Col, Container, Row, Pagination } from "react-bootstrap";
import EmailList from "./EmailList";
import EmailView from "./EmailView";
import ReplyEmail from "./ReplyMail";
import { EmailContext } from "../context/EmailContext";
import { addStar, getStarredEmails } from "../apis/emails/starEmail";

const Starred = () => {
  const { state, dispatch } = useContext(EmailContext);
  const { emails, selectedEmail } = state.starred;
  const [showReply, setShowReply] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const emailsPerPage = 10;

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const { emails, totalEmails } = await getStarredEmails(
          currentPage,
          emailsPerPage
        );
        dispatch({ type: "SET_STAR_EMAILS", emails, folder: "starred" });
        setTotalEmails(totalEmails);
      } catch (error) {
        console.error(error);
      }
    };
    fetchEmails();
  }, [dispatch, currentPage]);

  const handleEmailClick = (id) => {
    dispatch({ type: "SELECT_EMAIL", id, folder: "starred" });
  };

  const handleStarToggle = async (id) => {
    try {
      await addStar(id);
      dispatch({ type: "TOGGLE_STAR", id, folder: "starred" });
    } catch (error) {
      console.error("Failed to toggle star status", error);
    }
  };

  const handleReply = () => {
    dispatch({
      type: "REPLY_EMAIL",
      mode: "reply",
      email: selectedEmail,
      folder: "starred",
    });
    setShowReply(true);
  };

  const handleReplyAll = () => {
    dispatch({
      type: "REPLY_EMAIL",
      mode: "replyAll",
      email: selectedEmail,
      folder: "starred",
    });
    setShowReply(true);
  };

  const handleForward = () => {
    dispatch({
      type: "REPLY_EMAIL",
      mode: "forward",
      email: selectedEmail,
      folder: "starred",
    });
    setShowReply(true);
  };

  const handleCloseReply = () => setShowReply(false);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(totalEmails / emailsPerPage);

  return (
    <Container fluid>
      <Row>
        <Col lg={6} md={12} sm={12}>
          <EmailList
            emails={emails}
            handleEmailClick={handleEmailClick}
            handleStarToggle={handleStarToggle}
          />
          <Pagination>
            {[...Array(totalPages)].map((_, index) => (
              <Pagination.Item
                key={index + 1}
                active={index + 1 === currentPage}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </Col>
        <Col lg={6} md={12} sm={12}>
          {selectedEmail && (
            <EmailView
              folder="starred"
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
            />
          )}
          <ReplyEmail show={showReply} handleClose={handleCloseReply} />
        </Col>
      </Row>
    </Container>
  );
};

export default Starred;