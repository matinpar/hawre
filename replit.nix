{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.openssl          # موردنیاز Prisma
    pkgs.sqlite
    pkgs.bash
    pkgs.curl
  ];
  env = {
    PRISMA_QUERY_ENGINE_LIBRARY = "";
  };
}
