"""
Custom middlewares for estatemind_scrapers project
"""
from scrapy import signals
from scrapy.http import HtmlResponse
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message
import logging
import time

logger = logging.getLogger(__name__)


class EstatemindScrapersSpiderMiddleware:
    """
    Spider middleware for processing scraped items
    """
    
    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        return None

    def process_spider_output(self, response, result, spider):
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        logger.error(f"Spider exception for {response.url}: {exception}")

    def process_start_requests(self, start_requests, spider):
        for r in start_requests:
            yield r

    def spider_opened(self, spider):
        spider.logger.info(f"Spider opened: {spider.name}")


class EstatemindScrapersDownloaderMiddleware:
    """
    Downloader middleware for handling requests and responses
    """
    
    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        # Add custom headers or modify request
        return None

    def process_response(self, request, response, spider):
        # Check for CAPTCHA or blocking
        if self._is_blocked(response):
            spider.logger.warning(f"Blocked detected for {request.url}")
            return request.replace(dont_filter=True)
        
        return response

    def process_exception(self, request, exception, spider):
        logger.error(f"Exception for {request.url}: {exception}")

    def spider_opened(self, spider):
        spider.logger.info(f"Downloader middleware initialized for {spider.name}")

    def _is_blocked(self, response):
        """
        Detect if we've been blocked by checking for common blocking patterns
        """
        if response.status in [403, 429]:
            return True
        
        # Check for common CAPTCHA indicators
        if isinstance(response, HtmlResponse):
            body_text = response.text.lower()
            blocking_indicators = [
                "captcha",
                "access denied",
                "blocked",
                "robot",
                "suspicious activity",
            ]
            return any(indicator in body_text for indicator in blocking_indicators)
        
        return False


class CustomRetryMiddleware(RetryMiddleware):
    """
    Custom retry middleware with exponential backoff
    """
    
    def process_response(self, request, response, spider):
        if request.meta.get("dont_retry", False):
            return response
        
        if response.status in self.retry_http_codes:
            reason = response_status_message(response.status)
            retry_count = request.meta.get("retry_count", 0)
            
            # Exponential backoff
            wait_time = 2 ** retry_count
            logger.info(f"Retrying {request.url} (attempt {retry_count + 1}) after {wait_time}s")
            time.sleep(wait_time)
            
            return self._retry(request, reason, spider) or response
        
        return response


class AntiBlockMiddleware:
    """
    Middleware to avoid being blocked by implementing delays and headers rotation
    """
    
    def __init__(self):
        self.request_count = 0
        self.pause_threshold = 100  # Pause after every 100 requests
        self.pause_duration = 30  # Pause for 30 seconds
    
    def process_request(self, request, spider):
        self.request_count += 1
        
        # Periodic pause to avoid detection
        if self.request_count % self.pause_threshold == 0:
            logger.info(f"Pausing for {self.pause_duration}s after {self.request_count} requests")
            time.sleep(self.pause_duration)
        
        return None
