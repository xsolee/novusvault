import dramatiq
from dramatiq.brokers.redis import RedisBroker
from dramatiq.middleware import CurrentMessage

from app.core.config import get_settings

settings = get_settings()

# RedisBroker already registers a default Retries middleware; each actor
# below sets its own max_retries, so no need to add a second one here.
broker = RedisBroker(url=settings.redis_url)
broker.add_middleware(CurrentMessage())
dramatiq.set_broker(broker)
