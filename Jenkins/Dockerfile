FROM jenkins/jenkins:lts

USER root

# 1. Cài đặt Docker CLI bằng Static Binary (Bản 27.x)
# Cách này giúp bypass hoàn toàn lỗi "Unable to locate package"
RUN curl -L https://download.docker.com/linux/static/stable/x86_64/docker-27.0.3.tgz -o docker.tgz \
      && tar xzvf docker.tgz \
      && cp docker/docker /usr/local/bin/ \
      && rm -rf docker.tgz docker

# 2. Tạo nhóm docker và thêm user jenkins vào để có quyền gọi Socket
# GID 999 thường là mặc định của Docker, sếp có thể đổi nếu cần
RUN groupadd -g 999 docker || true \
      && usermod -aG docker jenkins

USER jenkins